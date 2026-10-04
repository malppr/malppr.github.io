// Shared data for the W2 design mockups (temporary — delete with src/pages/dev at cutover).
import { getCollection, type CollectionEntry } from 'astro:content';
import { ME, TAG_LABELS, isVisible, sortProjects, yearRange } from '../../../lib/format';

export type Project = CollectionEntry<'projects'>;
export type Area = 'ai' | 'robotics' | 'design';

export function area(p: Project): Area {
	const t = p.data.tags;
	if (t.includes('ai')) return 'ai';
	if (t.some((x) => ['robot-learning', 'hardware', 'hri', 'perception'].includes(x)) && !t.includes('design')) return 'robotics';
	return 'design';
}

export const AREA_LABEL: Record<Area, string> = { ai: 'AI', robotics: 'Robotics', design: 'Design' };

export async function loadMockData() {
	const projects = (await getCollection('projects', isVisible)).sort(sortProjects);
	const pubs = (await getCollection('publications')).sort((a, b) => b.data.year - a.data.year);
	return {
		main: projects.filter((p) => p.data.tier === 'main'),
		archive: projects.filter((p) => p.data.tier === 'archive'),
		pubs,
	};
}

export { ME, TAG_LABELS, yearRange };

export const LINKS = {
	github: 'https://github.com/malppr',
	linkedin: 'https://www.linkedin.com/in/bchewlj/',
	email: 'mailto:bryanchewlj@gmail.com',
};
