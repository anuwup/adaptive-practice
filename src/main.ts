import { MarkdownView, Notice, Plugin } from "obsidian";
import { AdaptivePracticeSettings, DEFAULT_SETTINGS, Question, QuizResult, SessionConfig, TopicNote } from "./types";
import { AdaptivePracticeSettingTab } from "./settings";
import { SetupModal } from "./ui/setup-modal";
import { QuizModal } from "./ui/quiz-modal";
import { ResultsModal } from "./ui/results-modal";
import { PracticeView, PRACTICE_VIEW_TYPE } from "./ui/practice-view";
import { generateQuestions, finalizeSession } from "./practice/session";

const DEFAULT_SECRET_ID = "gemini-api-key";

export default class AdaptivePracticePlugin extends Plugin {
	settings: AdaptivePracticeSettings = DEFAULT_SETTINGS;
	private sessionTopics: TopicNote[] = [];

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.migrateApiKey();

		this.registerView(PRACTICE_VIEW_TYPE, (leaf) => new PracticeView(leaf));

		this.app.workspace.onLayoutReady(() => {
			this.detachPracticeLeaves();
		});

		this.addRibbonIcon("graduation-cap", "Start practice session", () => {
			this.openSetupModal();
		});

		this.addCommand({
			id: "start",
			name: "Start practice session",
			callback: () => this.openSetupModal(),
		});

		this.addCommand({
			id: "practice-current-note",
			name: "Practice current note",
			checkCallback: (checking) => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) return false;
				if (!checking) {
					this.openSetupModal(view.file.path);
				}
				return true;
			},
		});

		this.addSettingTab(new AdaptivePracticeSettingTab(this.app, this));
	}

	onunload(): void {
		this.detachPracticeLeaves();
	}

	private detachPracticeLeaves(): void {
		this.app.workspace.getLeavesOfType(PRACTICE_VIEW_TYPE).forEach((leaf) => {
			leaf.detach();
		});
	}

	getSecretId(): string {
		const raw = (this.settings.secretName || DEFAULT_SECRET_ID).trim();
		const id = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
		return id || DEFAULT_SECRET_ID;
	}

	getApiKey(): string | null {
		return this.app.secretStorage.getSecret(this.getSecretId());
	}

	setApiKey(value: string): void {
		this.app.secretStorage.setSecret(this.getSecretId(), value);
	}

	private async migrateApiKey(): Promise<void> {
		if (this.settings.geminiApiKey) {
			const id = this.getSecretId();
			const existing = this.app.secretStorage.getSecret(id);
			if (!existing) {
				this.app.secretStorage.setSecret(id, this.settings.geminiApiKey);
			}
			this.settings.geminiApiKey = "";
			await this.saveSettings();
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private openSetupModal(preselectedPath?: string): void {
		new SetupModal(
			this.app,
			this.settings,
			(config) => this.startSession(config),
			preselectedPath
		).open();
	}

	private async startSession(config: SessionConfig): Promise<void> {
		const loadingNotice = new Notice("Generating questions\u2026", 0);
		this.sessionTopics = config.topics;

		try {
			const apiKey = this.getApiKey();
			if (!apiKey) {
				loadingNotice.hide();
				new Notice("Gemini API key not configured. Go to Settings \u2192 Adaptive Practice to add it.");
				return;
			}

			const questions = await generateQuestions(
				this.app,
				apiKey,
				config
			);

			loadingNotice.hide();

			if (questions.length === 0) {
				new Notice("No questions were generated. Try different topics.");
				return;
			}

			shuffle(questions);

			const usedTopics = new Set(
				questions.flatMap((q) => q.sourceTopics)
			);
			const selectedCount = config.topics.length;
			const usedCount = config.topics.filter((t) =>
				usedTopics.has(t.title)
			).length;
			new Notice(
				`${questions.length} questions generated from ${usedCount} / ${selectedCount} selected notes.`
			);

			const onComplete = async (results: QuizResult[]) => {
				const finalNotice = new Notice("Saving results\u2026", 0);
				try {
					const deltas = await finalizeSession(
						this.app,
						config.topics,
						results
					);
					finalNotice.hide();
					new ResultsModal(this.app, results, deltas).open();
				} catch (e) {
					finalNotice.hide();
					new Notice(
						`Error saving results: ${e instanceof Error ? e.message : String(e)}`
					);
				}
			};

			const onExpand = (qs: Question[], results: QuizResult[], currentIndex: number) => {
				this.openPracticeView(qs, results, currentIndex, config.topics, onComplete);
			};

			new QuizModal(this.app, questions, onComplete, onExpand).open();
		} catch (e) {
			loadingNotice.hide();
			new Notice(
				`Error: ${e instanceof Error ? e.message : String(e)}`
			);
		}
	}

	private async openPracticeView(
		questions: Question[],
		results: QuizResult[],
		currentIndex: number,
		topics: TopicNote[],
		onComplete: (results: QuizResult[]) => void
	): Promise<void> {
		const leaf = this.app.workspace.getLeaf("tab");
		await leaf.setViewState({ type: PRACTICE_VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);

		const view = leaf.view;
		if (view instanceof PracticeView) {
			view.setPracticeState({ questions, results, currentIndex, topics, onComplete });
		}
	}
}

function shuffle<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j]!, arr[i]!];
	}
}
