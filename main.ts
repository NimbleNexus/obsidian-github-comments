import { App, MarkdownView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from "obsidian";
import { Octokit } from "octokit";
import { CommentThreadView, COMMENT_THREAD_VIEW, type CommentThreadViewState } from "src/CommentThreadView";
import { commentsMarginField, listComments } from "src/CommentsMarginPlugin";
import { commentsStore, type Comments, threadKeyOf } from "src/stores/comments";

interface GitHubCommentsSettings {
	gh_token?: string;
	owner?: string;
	repo?: string;
}

const DEFAULT_SETTINGS: GitHubCommentsSettings = {};

export default class GitHubComments extends Plugin {
	settings!: GitHubCommentsSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension([ commentsMarginField ]);

		if (this.settings.gh_token && this.settings.owner && this.settings.repo) {
			const octokit = new Octokit({
				auth: this.settings.gh_token,
			});

			const owner = this.settings.owner;
			const repo = this.settings.repo;

			const comments = commentsStore({ octokit, owner, repo }, `.obsidian/plugins/${this.manifest.id}/comments.json`, this.app.vault);
			comments.refresh(); // TODO: Refresh only after enough time has passed or on command

			comments.subscribe(($comments) => {
				if (!$comments) return; // TODO: Can we have it not emit until it has a value?

				console.log($comments);

				const updateForMarkdownView = (view: MarkdownView) => {
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
						const [{ path, line, position }] = comments;
						return {
							lineNum: line!, // TODO: Why would this ever be undefined?
							commentCount: comments.length,
							click: () => this.activateView({ threadLocation: { path: path!, line: line!, position: position! }, comments }), // TODO: Consider passing the threadKey instead
						};
					});

					// @ts-expect-error, not typed
					const editorView = view.editor.cm as EditorView;

					editorView.dispatch({
						effects: listComments.of(listCommentsValue),
					});
				};

				// Update for the active file when the plugin loads
				this.app.workspace.iterateAllLeaves((leaf) => {
					if (leaf.view && leaf.view instanceof MarkdownView) {
						updateForMarkdownView(leaf.view);
					}
				})

				// Update for the active file when the active file changes
				// TODO: Move this registerEvent outside of subscribe
				this.registerEvent(
					this.app.workspace.on("file-open", (leaf) => {
						if (!leaf) return;
						const view = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (!view) return;
						if (view.file?.path !== leaf.path) {
							console.error(`Active view path ${view.file?.path} does not match leaf path ${leaf.path}`)
							return;
						}
						updateForMarkdownView(view);
					})
				);
			})
		}

		// This event is fired by the CommentThreadView
		this.registerEvent(
			// @ts-expect-error
			this.app.workspace.on("ogc:create-comment", async (...args) => {
				// TODO: Create comment using data layer
				console.info("TODO: Create comment:", ...args);
			})
		);

		this.addSettingTab(new GitHubCommentsSettingTab(this.app, this));

		this.registerView(COMMENT_THREAD_VIEW, (leaf) => new CommentThreadView(leaf));

		// TODO: Add command "Open GitHub comment thread at cursor"
	}

	onunload() {}

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
