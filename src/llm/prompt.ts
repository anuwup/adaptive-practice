import { TopicNote } from "../types";

const MAX_TOTAL_CONTENT_CHARS = 120_000;
const MAX_HISTORY_RATIO = 0.25;

export interface TopicContext {
	note: TopicNote;
	content: string;
	history: string;
}

export function buildPrompt(
	topics: TopicContext[],
	questionCount: number
): string {
	const budgeted = applyContentBudget(topics);

	const topicBlocks = budgeted
		.map((t) => {
			let block = `### Topic: ${t.note.title} (skill: ${t.note.skill}/100)\n`;
			block += `<note_content>\n${t.content}\n</note_content>\n`;
			if (t.history) {
				block += `<past_practice>\n${t.history}\n</past_practice>\n`;
			}
			return block;
		})
		.join("\n");

	return `You are a rigorous exam-setter creating challenging practice questions calibrated to competitive exam standards (JEE Main/Advanced, GRE, GATE, olympiad-style, or equivalent for the subject). Generate exactly ${questionCount} questions based on the provided notes.

## Difficulty calibration

Your difficulty levels must match these standards — this is critical:

**Easy** = university mid-semester exam level. Requires applying a concept in a slightly unfamiliar context. NOT simple recall or definition lookup. The student must do at least one non-trivial reasoning step.

**Medium** = JEE Main / GRE subject test level. Requires combining 2-3 concepts, multi-step reasoning, or recognizing a non-obvious pattern. Distractors should be plausible results of common mistakes.

**Hard** = JEE Advanced / olympiad / GATE level. Requires deep conceptual understanding, creative problem-solving, combining ideas across sub-topics, or spotting subtle edge cases. These should make a well-prepared student pause and think carefully.

Adjust the distribution based on skill level:
- Skill 0-30: 60% easy, 30% medium, 10% hard
- Skill 31-60: 30% easy, 45% medium, 25% hard
- Skill 61-80: 10% easy, 40% medium, 50% hard
- Skill 81-100: 0% easy, 25% medium, 75% hard

## Question quality rules

1. NEVER ask "which of the following is the definition of X" or "what is X called" — these are trivially easy regardless of difficulty label.
2. Every question must require REASONING, not recall. The student should need to work something out, not just remember a fact.
3. Use concrete scenarios, word problems, numerical computations, proofs-by-example, or "what happens when..." framing.
4. For MCQ: all 4 options must be plausible. Design distractors as results of common errors (sign mistakes, off-by-one, forgetting a condition, partial application of a rule). A student who half-understands should pick a wrong answer confidently.
5. When multiple topics are provided, create some questions that combine concepts across topics in non-obvious ways.
6. Look at past practice history to avoid repeating questions and to focus on areas where the student previously struggled.
7. Most questions should be MCQ with 4 options. Include a few integer-answer or decimal-answer questions if the content involves numerical/mathematical concepts.
8. Each question must reference which topic(s) it draws from using the exact topic title(s).
9. For any mathematical notation, use LaTeX wrapped in dollar signs: $x^2$ for inline, $$\\sum_{i=1}^{n} i$$ for display. Never write bare LaTeX without dollar sign delimiters.

## Topics

${topicBlocks}

## Response format

Respond with ONLY a JSON array. No markdown fences, no explanation. Each element must match this schema:

{
  "id": "q1",
  "type": "mcq" | "integer" | "decimal",
  "questionText": "The full question text",
  "options": ["option text 1", "option text 2", "option text 3", "option text 4"],
  "correctAnswer": "option text 1" or "42" or "3.14",
  "explanation": "Brief explanation of why this is correct",
  "sourceTopics": ["Topic Title 1", "Topic Title 2"],
  "difficulty": "easy" | "medium" | "hard"
}

For MCQ: "options" is required, "correctAnswer" must exactly match one option. Do NOT prefix options with letters like "A)", "B)", etc.
For integer/decimal: "options" should be omitted, "correctAnswer" is the numeric string.

Generate exactly ${questionCount} questions now.`;
}

function applyContentBudget(topics: TopicContext[]): TopicContext[] {
	if (topics.length === 0) return topics;

	const perTopicBudget = Math.floor(MAX_TOTAL_CONTENT_CHARS / topics.length);
	const historyBudget = Math.floor(perTopicBudget * MAX_HISTORY_RATIO);
	const contentBudget = perTopicBudget - historyBudget;

	return topics.map((t) => ({
		note: t.note,
		content: truncateText(t.content, contentBudget),
		history: truncateText(t.history, historyBudget),
	}));
}

function truncateText(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;

	const truncated = text.slice(0, maxChars);
	const lastNewline = truncated.lastIndexOf("\n");
	const cutPoint = lastNewline > maxChars * 0.8 ? lastNewline : maxChars;

	return truncated.slice(0, cutPoint) + "\n\n[...content truncated for length]";
}
