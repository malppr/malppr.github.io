// Scans the built site (dist/) for internal links and assets that don't resolve.
// Usage: node scripts/check-links.mjs  (run after `astro build`)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const pages = [];
const walk = (dir) => {
	for (const f of readdirSync(dir)) {
		const p = join(dir, f);
		if (statSync(p).isDirectory()) walk(p);
		else if (p.endsWith('.html')) pages.push(p);
	}
};
walk(DIST);

const resolves = (url) => {
	const path = decodeURIComponent(url.split(/[?#]/)[0]);
	if (path === '' || path === '/') return existsSync(join(DIST, 'index.html'));
	const target = join(DIST, path);
	return existsSync(target) && statSync(target).isFile() ? true : existsSync(join(target, 'index.html'));
};

const ids = new Map(pages.map((p) => [p, new Set([...readFileSync(p, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));
const broken = [];
for (const page of pages) {
	const html = readFileSync(page, 'utf8');
	for (const [, attr, url] of html.matchAll(/\s(href|src|srcset)="([^"]+)"/g)) {
		for (const u of attr === 'srcset' ? url.split(',').map((s) => s.trim().split(' ')[0]) : [url]) {
			if (!u.startsWith('/') || u.startsWith('//')) continue;
			if (!resolves(u)) broken.push(`${relative(DIST, page)} → ${u}`);
			const [path, hash] = u.split('#');
			if (hash && (path === '/' || path === '')) {
				if (!ids.get(join(DIST, 'index.html'))?.has(hash)) broken.push(`${relative(DIST, page)} → ${u} (missing #${hash})`);
			}
		}
	}
}

if (broken.length) {
	console.error(`✗ ${broken.length} broken internal link(s):\n  ` + [...new Set(broken)].join('\n  '));
	process.exit(1);
}
console.log(`✓ ${pages.length} pages, all internal links and assets resolve`);
