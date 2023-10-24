import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface GitHubCommentsSettings {
	mySetting?: string;
}

const DEFAULT_SETTINGS: GitHubCommentsSettings = {};

export default class GitHubComments extends Plugin {
	settings: GitHubCommentsSettings;

	async onload() {
		await this.loadSettings();

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
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting || "")
					.onChange(async (value) => {
						if (value.length > 0) {
							this.plugin.settings.mySetting = value;
						} else {
							delete this.plugin.settings.mySetting;
						}
						await this.plugin.saveSettings();
					})
			);
	}
}
