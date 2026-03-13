import { App, Modal } from "obsidian";
import { QuizResult, SkillDelta } from "../types";

export class ResultsModal extends Modal {
	private results: QuizResult[];
	private deltas: SkillDelta[];

	constructor(app: App, results: QuizResult[], deltas: SkillDelta[]) {
		super(app);
		this.results = results;
		this.deltas = deltas;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ap-results-modal");

		const correct = this.results.filter((r) => r.isCorrect).length;
		const total = this.results.length;

		contentEl.createEl("h2", { text: "Practice results" });

		// Score summary
		const scoreEl = contentEl.createDiv({ cls: "ap-score-summary" });
		scoreEl.createEl("span", {
			text: `${correct}`,
			cls: "ap-score-correct",
		});
		scoreEl.createEl("span", { text: ` / ${total} correct` });

		// Skill changes
		if (this.deltas.length > 0) {
			contentEl.createEl("h3", { text: "Skill changes" });
			const skillList = contentEl.createDiv({ cls: "ap-skill-changes" });
			for (const d of this.deltas) {
				const row = skillList.createDiv({ cls: "ap-skill-row" });
				row.createEl("span", {
					text: d.title,
					cls: "ap-skill-title",
				});

				const change = d.after - d.before;
				const sign = change >= 0 ? "+" : "";
				const cls =
					change >= 0 ? "ap-skill-change-up" : "ap-skill-change-down";

				row.createEl("span", {
					text: `${Math.round(d.before)} \u2192 ${Math.round(d.after)} (${sign}${change.toFixed(1)})`,
					cls,
				});
			}
		}

		// Question review
		contentEl.createEl("h3", { text: "Question review" });
		const reviewList = contentEl.createDiv({ cls: "ap-review-list" });

		for (let i = 0; i < this.results.length; i++) {
			const r = this.results[i]!;
			const item = reviewList.createDiv({
				cls: `ap-review-item ${r.isCorrect ? "ap-review-correct" : "ap-review-incorrect"}`,
			});

			item.createEl("div", {
				text: `${i + 1}. ${r.question.questionText}`,
				cls: "ap-review-question",
			});

			const details = item.createDiv({ cls: "ap-review-details" });
			details.createEl("span", {
				text: `Your answer: ${r.userAnswer}`,
			});
			if (!r.isCorrect) {
				details.createEl("span", {
					text: ` | Correct: ${r.question.correctAnswer}`,
				});
			}
		}

		// Close button
		const btnContainer = contentEl.createDiv({ cls: "ap-btn-container" });
		const closeBtn = btnContainer.createEl("button", {
			text: "Close",
			cls: "mod-cta",
		});
		closeBtn.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
