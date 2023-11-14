import { App, MarkdownView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, type MarkdownFileInfo, Editor } from "obsidian";
import { EditorView } from "@codemirror/view";
import { Octokit } from "octokit";
import { graphql } from "@octokit/graphql";
import { get } from "svelte/store";
import { CommentThreadView, COMMENT_THREAD_VIEW, type CommentThreadViewState } from "src/CommentThreadView";
import { commentsMarginField, listComments } from "src/CommentsMarginPlugin";
import { commentsStore, type Comments, threadKeyOf, type CreateCommentsParams } from "src/stores/comments";
import { viewerStore } from "src/stores/viewer";
import { blameStore } from "src/stores/blame";
import { getInsertPositionForLine } from "src/utils/patch";

declare module "obsidian" {
	interface Workspace {
		on(
			eventName: "ogc:create-comment",
			callback: (createCommentsParams: CreateCommentsParams) => any,
			ctx?: any
		): EventRef;
	}
}

interface GitHubCommentsSettings {
	gh_token?: string;
	owner?: string;
	repo?: string;
}

const DEFAULT_SETTINGS: GitHubCommentsSettings = {};

export default class GitHubComments extends Plugin {
	settings!: GitHubCommentsSettings;
	comments?: ReturnType<typeof commentsStore>;
	commentsUnsubscribe?: () => void;
	graphqlWithAuth?: typeof graphql;
	octokit?: Octokit;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension([ commentsMarginField ]);

		this.initializeDataLayer();

		// Update for the active file when the active file changes
		this.registerEvent(
			this.app.workspace.on("file-open", (leaf) => {
				if (!leaf) return;
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return;
				if (view.file?.path !== leaf.path) {
					console.error(`Active view path ${view.file?.path} does not match leaf path ${leaf.path}`)
					return;
				}
				if (this.comments) {
					const $comments = get(this.comments);
					this.decorateMarkdownView(view, $comments);
				}
			})
		);

		// This event is fired by the CommentThreadView
		this.registerEvent(
			this.app.workspace.on("ogc:create-comment", (createCommentsParams) => {
				if (!this.comments) return;
				this.comments.create(createCommentsParams);
			})
		);

		this.addCommand({
			id: "ogc:add-comment-at-cursor",
			name: "Add comment at cursor",
			hotkeys: [{ modifiers: ["Ctrl", "Alt"], key: "M" }], // TODO: Make this configurable
			editorCallback: async (
				editor: Editor,
				view: MarkdownView | MarkdownFileInfo
			) => {
				const path = view.file?.path;
				if (!path) {
					console.error("GitHub Comments: No path for active view.");
					return;
				}

				const line = editor.getCursor().line + 1;

				const sel = editor.getSelection();
				console.log(
					`For path ${path}; at line: ${line}; you have selected: ${JSON.stringify(
						sel
					)}`
				);

				if (!this.octokit || !this.graphqlWithAuth || !this.settings.owner || !this.settings.repo || !this.comments) {
					console.error("GitHub Comments: GraphQL client not initialized. Check auth, owner and repo your settings and try again.");
					return;
				}
				const { owner, repo } = this.settings;

				// TODO: This blame assumes HEAD, but we should use the commit of the workspace, if any
				const blame = blameStore(this.graphqlWithAuth, { owner, repo, commitSha: "HEAD", path });
				const blameResponse = await blame.refresh();
				const [{ commit_sha }] = blameResponse.resource.blame.ranges
					.filter(({ startingLine, endingLine }: any) => startingLine <= line && line <= endingLine)
					.map(({ commit: { oid: commit_sha }}: { commit: { oid: string }}) => ({ commit_sha }))

				const { data: commit } = await this.octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
					owner,
					repo,
					ref: commit_sha,
					headers: {
						"X-GitHub-Api-Version": "2022-11-28",
					},
				});
				if (!commit) {
					console.error("GitHub Comments: Commit not found for blame response", blameResponse);
				}

				const patch = commit.files?.find(({ filename }) => filename === path)?.patch;
				if (!patch) {
					console.error("GitHub Comments: Patch not found for commit", commit);
				}

				const position = getInsertPositionForLine(patch!, line);

				// TODO: Body obtained from user input (a view)
				const body = "This comment is created from code!";

				const createCommentsParams: CreateCommentsParams = {
					threadLocation: {
						commit_sha,
						path,
						line,
						position,
					},
					body: `${(sel || "") && `context: ${JSON.stringify(sel)}\n\n`}${body}`,
				};

				console.log(
					"Creating comment using params",
					createCommentsParams
				);
				this.comments.create(createCommentsParams);
			},
		});

		this.addSettingTab(new GitHubCommentsSettingTab(this.app, this));

		this.registerView(COMMENT_THREAD_VIEW, (leaf) => new CommentThreadView(leaf, this));
	}

	onunload() {
		if (this.commentsUnsubscribe) this.commentsUnsubscribe();
	}

	async activateView(state: CommentThreadViewState) {
		let { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		let leaves = workspace.getLeavesOfType(COMMENT_THREAD_VIEW);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
		}
		await leaf.setViewState({
			type: COMMENT_THREAD_VIEW,
			active: true,
			state,
		});

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	// TODO: On Settings Change, load or clear comments

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	initializeDataLayer() {
		// TODO: If settings unset, clear comments
		// TODO: If settings the same, do nothing
		// TODO: If API call fails, warn the user and clear comments
		// TODO: Instead of clearing comments, offer to keep the comments cache
		if (this.settings.gh_token && this.settings.owner && this.settings.repo) {
			const octokit = this.octokit = new Octokit({
				auth: this.settings.gh_token,
			});

			const owner = this.settings.owner;
			const repo = this.settings.repo;

			const comments = this.comments = commentsStore({ octokit, owner, repo }, `.obsidian/plugins/${this.manifest.id}/comments.json`, this.app.vault);
			comments.refresh(); // TODO: Refresh only after enough time has passed or on command

			if (this.commentsUnsubscribe) this.commentsUnsubscribe();
			this.commentsUnsubscribe = comments.subscribe(($comments) => {
				if (!$comments) return; // TODO: Can we have it not emit until it has a value?

				// Update for the active file when the plugin loads
				this.app.workspace.iterateAllLeaves((leaf) => {
					if (leaf.view && leaf.view instanceof MarkdownView) {
						this.decorateMarkdownView(leaf.view, $comments);
					}
				})
			})

			const graphqlWithAuth = this.graphqlWithAuth = graphql.defaults({
				headers: {
					authorization: `token ${this.settings.gh_token}`,
				},
			});

			const viewer = viewerStore(graphqlWithAuth);
			viewer.refresh();
			viewer.subscribe(($viewer) => {
				console.log('viewer', $viewer);
			});
		}
	}

	decorateMarkdownView(view: MarkdownView, $comments: Comments) {
		const activePath = view.file!.path;
		const listCommentsValue = Array.from(
			$comments
				.filter(({ path }) => path === activePath)
				// GROUP BY `${line}:${position}`
				// SORT BY `created_at`
				// PICK FIRST
				.reduce((acc, comment) => {
					const key = threadKeyOf(comment);
					if (!acc.has(key)) {
						acc.set(key, [ comment ]);
					} else {
						const accValue = acc.get(key)!; // TODO: Should TypeScript infer from the if-else clause and `.has()`?
						accValue.push(comment);
					}
					return acc;
				}, new Map<string, Comments>())
				.values()
		).map((comments) => {
			const [{ commit_id, path, line, position }] = comments;
			return {
				lineNum: line!, // TODO: Why would this ever be undefined?
				commentCount: comments.length,
				click: () => this.activateView({ threadLocation: { commit_sha: commit_id!, path: path!, line: line!, position: position! } }),
			};
		});

		// @ts-expect-error, not typed
		const editorView = view.editor.cm as EditorView;

		editorView.dispatch({
			effects: listComments.of(listCommentsValue),
		});
	}
}

class GitHubCommentsSettingTab extends PluginSettingTab {
	plugin: GitHubComments;

	constructor(app: App, plugin: GitHubComments) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("GitHub Personal Access Token")
			.setDesc(
				document.createRange().createContextualFragment(`
					Find it in <a href="https://github.com/settings/tokens">GitHub &gt; Profile &gt; Settings &gt; Developer Settings &gt; Personal access tokens</a><br>
					and find more information and best practices at <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens">Managing your personal access tokens</a>
				`.trim())
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. ghp_XxYy...")
					.setValue(this.plugin.settings.gh_token || "")
					.onChange(async (value) => {
						if (value.length > 0) {
							this.plugin.settings.gh_token = value;
						} else {
							delete this.plugin.settings.gh_token;
						}
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Owner")
			.setDesc("The owner of the repository")
			.addText((text) =>
				text
					.setPlaceholder("e.g. NimbleNexus")
					.setValue(this.plugin.settings.owner || "")
					.onChange(async (value) => {
						if (value.length > 0) {
							this.plugin.settings.owner = value;
						} else {
							delete this.plugin.settings.owner;
						}
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Repository")
			.setDesc("The repository to use")
			.addText((text) =>
				text
					.setPlaceholder("e.g. obsidian-github-comments")
					.setValue(this.plugin.settings.repo || "")
					.onChange(async (value) => {
						if (value.length > 0) {
							this.plugin.settings.repo = value;
						} else {
							delete this.plugin.settings.repo;
						}
						await this.plugin.saveSettings();
					})
			);
	}
}
