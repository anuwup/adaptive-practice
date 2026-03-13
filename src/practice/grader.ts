import { Difficulty, Question, QuizResult, SkillDelta, TopicNote } from "../types";

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
	easy: 0.5,
	medium: 1.0,
	hard: 1.5,
};

export function checkAnswer(question: Question, userAnswer: string): boolean {
	const correct = question.correctAnswer.trim();
	const given = userAnswer.trim();

	if (question.type === "mcq") {
		return correct.toLowerCase() === given.toLowerCase();
	}

	const correctNum = parseFloat(correct);
	const givenNum = parseFloat(given);
	if (isNaN(correctNum) || isNaN(givenNum)) return false;

	if (question.type === "integer") {
		return Math.round(correctNum) === Math.round(givenNum);
	}

	// decimal: allow 1% relative tolerance or 0.01 absolute
	const absDiff = Math.abs(correctNum - givenNum);
	return absDiff <= 0.01 || absDiff <= Math.abs(correctNum) * 0.01;
}

export function computeSkillDeltas(
	topics: TopicNote[],
	results: QuizResult[]
): SkillDelta[] {
	const skillMap = new Map<string, { note: TopicNote; skill: number }>();
	for (const t of topics) {
		skillMap.set(t.title, { note: t, skill: t.skill });
	}

	for (const r of results) {
		const mult = DIFFICULTY_MULTIPLIER[r.question.difficulty];
		for (const topicTitle of r.question.sourceTopics) {
			const entry = skillMap.get(topicTitle);
			if (!entry) continue;

			if (r.isCorrect) {
				entry.skill = Math.min(
					100,
					entry.skill + (100 - entry.skill) * 0.08 * mult
				);
			} else {
				entry.skill = Math.max(
					0,
					entry.skill - entry.skill * 0.05 * mult
				);
			}
		}
	}

	return topics.map((t) => {
		const entry = skillMap.get(t.title);
		return {
			path: t.path,
			title: t.title,
			before: t.skill,
			after: entry ? entry.skill : t.skill,
		};
	});
}
