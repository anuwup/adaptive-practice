export type FilterOperator =
	| "contains" | "does not contain"
	| "contains any of" | "does not contain any of"
	| "contains all of" | "does not contain all of"
	| "is" | "is not"
	| "starts with" | "ends with"
	| "is empty" | "is not empty"
	| "links to" | "does not link to"
	| "in folder" | "is not in folder"
	| "has tag" | "does not have tag"
	| "has property" | "does not have property"
	| "on" | "not on"
	| "before" | "on or before"
	| "after" | "on or after";

export type FilterConjunction = "AND" | "OR" | "NOR";

export interface Filter {
	type: "filter";
	field: string;
	operator: FilterOperator;
	value?: string;
}

export interface FilterGroup {
	type: "group";
	operator: FilterConjunction;
	conditions: (Filter | FilterGroup)[];
}

export const DEFAULT_FILTER_RULES: FilterGroup = {
	type: "group",
	operator: "AND",
	conditions: [],
};

export interface AdaptivePracticeSettings {
	geminiApiKey: string;
	secretName: string;
	practiceFolder: string;
	filterRules: FilterGroup;
	defaultQuestionCount: number;
}

export const DEFAULT_SETTINGS: AdaptivePracticeSettings = {
	geminiApiKey: "",
	secretName: "gemini-api-key",
	practiceFolder: "",
	filterRules: JSON.parse(JSON.stringify(DEFAULT_FILTER_RULES)) as FilterGroup,
	defaultQuestionCount: 10,
};

export type QuestionType = "mcq" | "integer" | "decimal";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
	id: string;
	type: QuestionType;
	questionText: string;
	options?: string[];
	correctAnswer: string;
	explanation: string;
	sourceTopics: string[];
	difficulty: Difficulty;
}

export interface QuizResult {
	question: Question;
	userAnswer: string;
	isCorrect: boolean;
	skipped: boolean;
	timeTakenMs: number;
}

export interface TopicNote {
	path: string;
	title: string;
	skill: number;
}

export interface SessionConfig {
	topics: TopicNote[];
	questionCount: number;
}

export interface SkillDelta {
	path: string;
	title: string;
	before: number;
	after: number;
}
