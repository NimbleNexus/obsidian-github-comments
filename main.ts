import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Octokit } from "octokit";

interface GitHubCommentsSettings {
	gh_token?: string;
	owner?: string;
	repo?: string;
}

const DEFAULT_SETTINGS: GitHubCommentsSettings = {};

export default class GitHubComments extends Plugin {
	settings: GitHubCommentsSettings;

	async onload() {
		await this.loadSettings();

		if (this.settings.gh_token && this.settings.owner && this.settings.repo) {
			const octokit = new Octokit({
				auth: this.settings.gh_token,
			});

			const owner = this.settings.owner;
			const repo = this.settings.repo;

			const comments = await octokit.request(
				"GET /repos/{owner}/{repo}/comments",
				{
					owner,
					repo,
					headers: {
						"X-GitHub-Api-Version": "2022-11-28",
					},
				}
			);

			const ref = comments.data.at(-1)?.commit_id!;

			const commit = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
				owner,
				repo,
				ref,
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			});

			console.log(comments, commit);
		}

		this.addSettingTab(new GitHubCommentsSettingTab(this.app, this));
	}

	onunload() {}

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
