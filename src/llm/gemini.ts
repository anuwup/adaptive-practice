import { requestUrl } from "obsidian";
import { Question } from "../types";

const GEMINI_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export class GeminiClient {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async generateQuestions(prompt: string): Promise<Question[]> {
		const body = {
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: {
				temperature: 0.8,
				maxOutputTokens: 8192,
				responseMimeType: "application/json",
			},
		};
		const bodyStr = JSON.stringify(body);

		const response = await requestUrl({
			url: `${GEMINI_URL}?key=${this.apiKey}`,
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: bodyStr,
		});

		if (response.status !== 200) {
			throw new Error(
				`Gemini API error (${response.status}): ${response.text}`
			);
		}

		const data = response.json;
		const text =
			data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

		return parseQuestions(text);
	}
}

function parseQuestions(raw: string): Question[] {
	let cleaned = raw.trim();
	if (cleaned.startsWith("```")) {
		cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
	}

	const parsed: unknown = JSON.parse(cleaned);
	if (!Array.isArray(parsed)) {
		throw new Error("LLM response is not a JSON array");
	}

	return parsed.map((item: Record<string, unknown>, i: number) => {
		const q: Question = {
			id: String(item["id"] ?? `q${i + 1}`),
			type: validateType(item["type"]),
			questionText: String(item["questionText"] ?? ""),
			correctAnswer: String(item["correctAnswer"] ?? ""),
			explanation: String(item["explanation"] ?? ""),
			sourceTopics: Array.isArray(item["sourceTopics"])
				? item["sourceTopics"].map(String)
				: [],
			difficulty: validateDifficulty(item["difficulty"]),
		};
		if (q.type === "mcq" && Array.isArray(item["options"])) {
			q.options = item["options"].map((o) => stripOptionPrefix(String(o)));
			q.correctAnswer = stripOptionPrefix(q.correctAnswer);
		}
		return q;
	});
}

function stripOptionPrefix(text: string): string {
	return text.replace(/^[A-Da-d][).]\s*/, "");
}

function validateType(v: unknown): Question["type"] {
	if (v === "mcq" || v === "integer" || v === "decimal") return v;
	return "mcq";
}

function validateDifficulty(v: unknown): Question["difficulty"] {
	if (v === "easy" || v === "medium" || v === "hard") return v;
	return "medium";
}
