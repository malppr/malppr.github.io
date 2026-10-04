import type { CollectionEntry } from 'astro:content';

export const ME = /^B\.( L\.)? Chew$/;

export const TAG_LABELS: Record<string, string> = {
	'robot-learning': 'Robot Learning',
	ai: 'AI',
	perception: 'Perception',
	hardware: 'Hardware',
	hri: 'HRI',
	design: 'Design',
};

// Top-level area shown on the site, derived from tags.
export type Area = 'ai' | 'robotics' | 'design';

export const AREA_LABELS: Record<Area, string> = { ai: 'AI', robotics: 'Robotics', design: 'Design' };

export function areaOf(tags: readonly string[]): Area {
	if (tags.includes('ai')) return 'ai';
	if (tags.includes('design')) return 'design';
	return 'robotics';
}

export function yearRange(start: Date, end?: Date, ongoing = false): string {
	const a = start.getUTCFullYear();
	if (ongoing) return `${a} – now`;
	if (!end) return `${a}`;
	const b = end.getUTCFullYear();
	return a === b ? `${a}` : `${a} – ${b}`;
}

export function formatDate(d: Date): string {
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// Drafts are visible in `npm run dev` so they can be previewed, never in builds.
export const isVisible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

export function sortProjects(a: CollectionEntry<'projects'>, b: CollectionEntry<'projects'>) {
	return a.data.order - b.data.order || b.data.date.getTime() - a.data.date.getTime();
}
