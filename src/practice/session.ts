import { App } from "obsidian";
import {
	Question,
	QuizResult,
	SessionConfig,
	SkillDelta,
	TopicNote,
} from "../types";
import { getNoteContent, getPastHistory } from "../notes/reader";
import { updateSkill } from "../notes/writer";
import { buildPrompt } from "../llm/prompt";
import { GeminiClient } from "../llm/gemini";
import { computeSkillDeltas } from "./grader";

export async function generateQuestions(
	app: App,
	apiKey: string,
	config: SessionConfig
): Promise<Question[]> {
	const topicContexts = await Promise.all(
		config.topics.map(async (note) => ({
			note,
			content: await getNoteContent(app, note.path),
			history: await getPastHistory(app, note.path),
		}))
	);

	shuffle(topicContexts);

	const prompt = buildPrompt(topicContexts, config.questionCount);
	const client = new GeminiClient(apiKey);

	try {
		return await client.generateQuestions(prompt);
	} catch (e) {
		// Only retry once if this looks like a JSON parse problem,
		// not for HTTP errors such as 429 rate limiting.
		const isParseError =
			e instanceof SyntaxError ||
			(e instanceof Error &&
				/eof|unexpected token|json/i.test(e.message));

		if (!isParseError) {
			throw new Error(
				`Failed to generate questions: ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}

		try {
			return await client.generateQuestions(prompt);
		} catch (retryError) {
			throw new Error(
				`Failed to generate questions after retry: ${
					retryError instanceof Error
						? retryError.message
						: String(retryError)
				}`
			);
		}
	}
}

export async function finalizeSession(
	app: App,
	topics: TopicNote[],
	results: QuizResult[]
): Promise<SkillDelta[]> {
	const deltas = computeSkillDeltas(topics, results);

	for (const delta of deltas) {
		await updateSkill(app, delta.path, delta.after);
	}

	return deltas;
}

function shuffle<T>(arr: T[]): void {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j]!, arr[i]!];
	}
}
