import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const TAGS = ['robot-learning', 'ai', 'perception', 'hardware', 'hri', 'design'] as const;

// Each project is a folder: src/content/projects/<slug>/index.mdx plus its media.
const projects = defineCollection({
	loader: glob({
		pattern: '*/index.mdx',
		base: './src/content/projects',
		generateId: ({ entry }) => entry.split('/')[0],
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.string(),
			date: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			status: z.enum(['ongoing', 'complete']).default('complete'),
			tags: z.array(z.enum(TAGS)).min(1),
			featured: z.boolean().default(false),
			tier: z.enum(['main', 'archive']).default('main'),
			order: z.number().default(100),
			context: z.string().optional(), // e.g. "SUTD capstone with NCS"
			role: z.string().optional(),
			cover: image(),
			coverAlt: z.string(),
			coverVideo: z.string().optional(),
			hero: image().optional(),
			heroAlt: z.string().optional(),
			links: z
				.object({
					paper: z.url().optional(),
					arxiv: z.url().optional(),
					code: z.url().optional(),
					video: z.url().optional(),
					demo: z.string().optional(),
					more: z.url().optional(),
				})
				.default({}),
			demo: z.enum(['maze', 'pusht']).optional(),
			draft: z.boolean().default(false),
		}),
});

// Dev log entries, optionally tied to a project.
const lab = defineCollection({
	loader: glob({ pattern: '*.mdx', base: './src/content/lab' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		summary: z.string(),
		project: reference('projects').optional(),
		draft: z.boolean().default(false),
	}),
});

const publications = defineCollection({
	loader: file('src/content/publications.yaml'),
	schema: z.object({
		title: z.string(),
		authors: z.array(z.string()),
		venue: z.string(),
		year: z.number(),
		links: z
			.object({
				paper: z.url().optional(),
				arxiv: z.url().optional(),
				doi: z.url().optional(),
			})
			.default({}),
		project: reference('projects').optional(),
	}),
});

export const collections = { projects, lab, publications };
