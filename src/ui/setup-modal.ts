import { App, Modal, Notice, Setting } from "obsidian";
import { AdaptivePracticeSettings, SessionConfig, TopicNote, FilterGroup, DEFAULT_FILTER_RULES } from "../types";
import { getTopicNotes, getTopicNotesWithFilters } from "../notes/reader";
import { FilterBuilder } from "../filters/builder";

export class SetupModal extends Modal {
	private settings: AdaptivePracticeSettings;
	private onStart: (config: SessionConfig) => void;
	private preselectedPath: string | null;

	private selectedPaths = new Set<string>();
	private questionCount: number;
	private allTopics: TopicNote[] = [];
	private useFilter = false;
	private sessionFilterRules: FilterGroup;

	constructor(
		app: App,
		settings: AdaptivePracticeSettings,
		onStart: (config: SessionConfig) => void,
		preselectedPath?: string
	) {
		super(app);
		this.settings = settings;
		this.onStart = onStart;
		this.preselectedPath = preselectedPath ?? null;
		this.questionCount = settings.defaultQuestionCount;
		this.sessionFilterRules = JSON.parse(JSON.stringify(DEFAULT_FILTER_RULES)) as FilterGroup;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ap-setup-modal");

		contentEl.createEl("h2", { text: "Start practice session" });

		this.allTopics = getTopicNotes(this.app, this.settings.practiceFolder, this.settings.filterRules);

		if (this.allTopics.length === 0 && !this.useFilter) {
			contentEl.createEl("p", {
				text: "No notes found in the configured practice folder.",
				cls: "ap-empty-state",
			});
		}

		if (this.preselectedPath) {
			this.selectedPaths.add(this.preselectedPath);
		}

		const modeContainer = contentEl.createDiv({ cls: "ap-mode-toggle" });

		new Setting(modeContainer)
			.setName("Use filters to select topics")
			.setDesc("Build filter conditions to select topics instead of picking manually.")
			.addToggle((toggle) =>
				toggle.setValue(this.useFilter).onChange((val) => {
					this.useFilter = val;
					this.renderTopicSection(topicSection);
				})
			);

		const topicSection = contentEl.createDiv({ cls: "ap-topic-section" });
		this.renderTopicSection(topicSection);

		new Setting(contentEl)
			.setName("Number of questions")
			.addSlider((slider) =>
				slider
					.setLimits(5, 30, 1)
					.setValue(this.questionCount)
					.setDynamicTooltip()
					.onChange((v) => {
						this.questionCount = v;
					})
			);

		const btnContainer = contentEl.createDiv({ cls: "ap-btn-container" });
		const startBtn = btnContainer.createEl("button", {
			text: "Start practice",
			cls: "mod-cta",
		});
		startBtn.addEventListener("click", () => {
			let topics: TopicNote[];
			if (this.useFilter) {
				topics = getTopicNotesWithFilters(this.app, this.sessionFilterRules);
				if (topics.length === 0) {
					new Notice("No notes match the current filters.");
					return;
				}
			} else {
				if (this.selectedPaths.size === 0) {
					new Notice("Select at least one topic.");
					return;
				}
				topics = this.allTopics.filter((t) => this.selectedPaths.has(t.path));
			}
			this.close();
			this.onStart({ topics, questionCount: this.questionCount });
		});
	}

	private renderTopicSection(container: HTMLElement): void {
		container.empty();

		if (this.useFilter) {
			container.createEl("h3", { text: "Filter conditions" });
			container.createEl("p", {
				text: "Notes matching these conditions will be used as topics.",
				cls: "setting-item-description",
			});
			const rulesContainer = container.createDiv({ cls: "ap-bases-query-container" });
			const builder = new FilterBuilder(
				this.app,
				this.sessionFilterRules,
				() => { this.updateFilterPreview(container); },
				() => { rulesContainer.empty(); builder.render(rulesContainer); this.updateFilterPreview(container); }
			);
			builder.render(rulesContainer);
			this.updateFilterPreview(container);
		} else {
			const topicHeader = container.createDiv({ cls: "ap-topic-header" });
			topicHeader.createEl("h3", { text: "Select topics" });

			const selectAllLabel = topicHeader.createEl("label", { cls: "ap-select-all" });
			const selectAllCheckbox = selectAllLabel.createEl("input", { type: "checkbox" });
			selectAllLabel.createEl("span", { text: "Select all" });

			const topicContainer = container.createDiv({ cls: "ap-topic-list" });
			const checkboxes: HTMLInputElement[] = [];

			selectAllCheckbox.addEventListener("change", () => {
				const checked = selectAllCheckbox.checked;
				for (let i = 0; i < this.allTopics.length; i++) {
					const cb = checkboxes[i]!;
					cb.checked = checked;
					const path = this.allTopics[i]!.path;
					if (checked) this.selectedPaths.add(path);
					else this.selectedPaths.delete(path);
				}
			});

			for (const topic of this.allTopics) {
				const row = topicContainer.createDiv({ cls: "ap-topic-row" });
				const checkbox = row.createEl("input", { type: "checkbox" });
				checkbox.checked = this.selectedPaths.has(topic.path);
				checkboxes.push(checkbox);
				checkbox.addEventListener("change", () => {
					if (checkbox.checked) this.selectedPaths.add(topic.path);
					else this.selectedPaths.delete(topic.path);
					selectAllCheckbox.checked = this.selectedPaths.size === this.allTopics.length;
				});
				row.addEventListener("click", (e) => {
					if (e.target === checkbox) return;
					checkbox.checked = !checkbox.checked;
					checkbox.dispatchEvent(new Event("change"));
				});
				row.createEl("span", { text: topic.title, cls: "ap-topic-title" });
				const skillBadge = row.createEl("span", { cls: "ap-skill-badge" });
				skillBadge.setText(`${Math.round(topic.skill)}`);
				skillBadge.title = `Skill: ${Math.round(topic.skill)}/100`;
				if (topic.skill < 30) skillBadge.addClass("ap-skill-low");
				else if (topic.skill < 70) skillBadge.addClass("ap-skill-mid");
				else skillBadge.addClass("ap-skill-high");
			}
		}
	}

	private updateFilterPreview(container: HTMLElement): void {
		let preview = container.querySelector(".ap-filter-preview") as HTMLElement | null;
		if (!preview) {
			preview = container.createDiv({ cls: "ap-filter-preview" });
		}
		const matched = getTopicNotesWithFilters(this.app, this.sessionFilterRules);
		preview.empty();
		preview.createEl("span", {
			text: `${matched.length} note${matched.length !== 1 ? "s" : ""} matched`,
			cls: matched.length > 0 ? "ap-filter-match-count" : "ap-filter-match-count ap-filter-no-match",
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
