import { App, PluginSettingTab, Setting } from "obsidian";
import type AdaptivePracticePlugin from "./main";
import { FilterBuilder } from "./filters/builder";

export class AdaptivePracticeSettingTab extends PluginSettingTab {
	plugin: AdaptivePracticePlugin;

	constructor(app: App, plugin: AdaptivePracticePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("p", {
			text: "This plugin sends note content to Google\u2019s Gemini API to generate practice questions. Your API key is stored securely using Obsidian\u2019s secret storage.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Secret name")
			.setDesc("Name of the secret in the keychain where your Gemini API key is stored. Use the same name you used when saving the key. Default: gemini-api-key.")
			.addText((text) =>
				text
					.setPlaceholder("gemini-api-key")
					.setValue(this.plugin.settings.secretName || "gemini-api-key")
					.onChange(async (value) => {
						this.plugin.settings.secretName = value.trim() || "gemini-api-key";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Practice folder")
			.setDesc(
				"Only notes inside this folder will appear as topics. Leave empty to use the entire vault."
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. Topics")
					.setValue(this.plugin.settings.practiceFolder)
					.onChange(async (value) => {
						this.plugin.settings.practiceFolder = value.trim();
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Note filters" });
		containerEl.createEl("p", {
			text: "Optionally filter which notes appear as topics using conditions on properties, tags, folders, etc. These are applied in addition to the practice folder above.",
			cls: "setting-item-description",
		});

		const rulesContainer = containerEl.createDiv({ cls: "ap-bases-query-container" });
		const builder = new FilterBuilder(
			this.app,
			this.plugin.settings.filterRules,
			() => { void this.plugin.saveSettings(); },
			() => { rulesContainer.empty(); builder.render(rulesContainer); }
		);
		builder.render(rulesContainer);

		new Setting(containerEl)
			.setName("Default number of questions")
			.setDesc("Pre-filled question count when starting a session (5\u201330).")
			.addSlider((slider) =>
				slider
					.setLimits(5, 30, 1)
					.setValue(this.plugin.settings.defaultQuestionCount)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.defaultQuestionCount = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
