import { App, TFile } from "obsidian";
import { FilterGroup, TopicNote } from "../types";
import { checkRules } from "../filters/matcher";

const DEFAULT_SKILL = 50;
const HISTORY_HEADING = "## Practice history";

export function getTopicNotes(app: App, folder: string, filterRules?: FilterGroup): TopicNote[] {
	const files = app.vault.getMarkdownFiles().filter((f) => {
		if (folder && !(f.path.startsWith(folder + "/") || f.path === folder)) return false;
		if (filterRules && filterRules.conditions.length > 0) {
			const cache = app.metadataCache.getFileCache(f);
			if (!checkRules(app, filterRules, f, cache?.frontmatter ?? undefined)) return false;
		}
		return true;
	});

	return files.map((f) => ({
		path: f.path,
		title: f.basename,
		skill: getSkillFromCache(app, f),
	}));
}

export function getTopicNotesWithFilters(app: App, filterRules: FilterGroup): TopicNote[] {
	const files = app.vault.getMarkdownFiles().filter((f) => {
		if (filterRules.conditions.length === 0) return true;
		const cache = app.metadataCache.getFileCache(f);
		return checkRules(app, filterRules, f, cache?.frontmatter ?? undefined);
	});

	return files.map((f) => ({
		path: f.path,
		title: f.basename,
		skill: getSkillFromCache(app, f),
	}));
}

function getSkillFromCache(app: App, file: TFile): number {
	const cache = app.metadataCache.getFileCache(file);
	const skill = cache?.frontmatter?.["skill"];
	if (typeof skill === "number" && skill >= 0 && skill <= 100) return skill;
	return DEFAULT_SKILL;
}

export async function getNoteContent(app: App, path: string): Promise<string> {
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) return "";
	return app.vault.read(file);
}

export async function getPastHistory(
	app: App,
	path: string
): Promise<string> {
	const content = await getNoteContent(app, path);
	const idx = content.indexOf(HISTORY_HEADING);
	if (idx === -1) return "";
	return content.slice(idx);
}
