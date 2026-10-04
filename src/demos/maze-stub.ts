// Placeholder for the maze-bot package (see PLAN.md §8). Implements the same
// `mountMazeDemo(el, opts)` contract with a hand-written wander controller —
// NOT the learned policy. Swap the export in ./maze.ts when maze-bot ships.
import spriteUrl from '../assets/mascot/mascot-top.svg?url';

export interface MazeDemoOptions {
	mode?: 'obstacles' | 'draw';
	showNetwork?: boolean;
}

export interface MazeDemoHandle {
	destroy(): void;
}

interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

const W = 10; // world units
const H = 6.25;
const R = 0.32; // robot radius
const RAY_ANGLES = [-60, -30, 0, 30, 60].map((d) => (d * Math.PI) / 180);
const RAY_MAX = 2.5;

const WALLS: Rect[] = [
	// arena border
	{ x: -1, y: -1, w: W + 2, h: 1 },
	{ x: -1, y: H, w: W + 2, h: 1 },
	{ x: -1, y: 0, w: 1, h: H },
	{ x: W, y: 0, w: 1, h: H },
	// obstacles
	{ x: 2.6, y: 0, w: 0.3, h: 2.6 },
	{ x: 5.0, y: 3.4, w: 0.3, h: 2.85 },
	{ x: 7.2, y: 1.2, w: 1.6, h: 0.3 },
	{ x: 1.2, y: 4.2, w: 1.4, h: 0.3 },
];

// Distance along a ray to the nearest rect (slab method), capped at RAY_MAX.
function castRay(x: number, y: number, a: number): number {
	const dx = Math.cos(a);
	const dy = Math.sin(a);
	let best = RAY_MAX;
	for (const r of WALLS) {
		let tmin = -Infinity;
		let tmax = Infinity;
		for (const [o, d, lo, hi] of [
			[x, dx, r.x, r.x + r.w],
			[y, dy, r.y, r.y + r.h],
		]) {
			if (Math.abs(d) < 1e-9) {
				if (o < lo || o > hi) {
					tmin = Infinity;
					break;
				}
			} else {
				const t1 = (lo - o) / d;
				const t2 = (hi - o) / d;
				tmin = Math.max(tmin, Math.min(t1, t2));
				tmax = Math.min(tmax, Math.max(t1, t2));
			}
		}
		if (tmin <= tmax && tmin > 0 && tmin < best) best = tmin;
	}
	return best;
}

function collides(x: number, y: number): boolean {
	return WALLS.some((r) => {
		const cx = Math.max(r.x, Math.min(x, r.x + r.w));
		const cy = Math.max(r.y, Math.min(y, r.y + r.h));
		return (x - cx) ** 2 + (y - cy) ** 2 < R * R;
	});
}

export function mountMazeDemo(el: HTMLElement, _opts: MazeDemoOptions = {}): MazeDemoHandle {
	const canvas = document.createElement('canvas');
	canvas.setAttribute('role', 'img');
	canvas.setAttribute('aria-label', 'Wheely, seen from above, wandering around an arena with a few walls');
	canvas.style.display = 'block';
	canvas.style.width = '100%';
	canvas.style.aspectRatio = `${W} / ${H}`;
	el.append(canvas);
	const ctx = canvas.getContext('2d')!;

	const sprite = new Image();
	sprite.src = spriteUrl;

	const bot = { x: 1.2, y: 1.4, th: 0.3 };
	let rays = RAY_ANGLES.map(() => RAY_MAX);
	let noise = 0;
	let scale = 1;
	let raf = 0;
	let last = 0;
	let visible = false;

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = el.clientWidth;
		scale = w / W;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round((w * H * dpr) / W);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		draw();
	};

	const step = (dt: number) => {
		rays = RAY_ANGLES.map((a) => castRay(bot.x, bot.y, bot.th + a));
		const left = Math.min(rays[0], rays[1]);
		const right = Math.min(rays[3], rays[4]);
		const front = rays[2];
		noise += (Math.random() - 0.5) * 0.6 - noise * 0.05;
		let turn = (right - left) * 0.9 + noise * 0.8;
		if (front < 1.0) turn += (right >= left ? 1 : -1) * 2.4;
		const v = 1.1 * Math.min(1, Math.max(0.15, (front - 0.45) / 1.4));
		bot.th += turn * dt;
		const nx = bot.x + Math.cos(bot.th) * v * dt;
		const ny = bot.y + Math.sin(bot.th) * v * dt;
		if (collides(nx, ny)) bot.th += Math.PI * 0.5 * dt * 6;
		else {
			bot.x = nx;
			bot.y = ny;
		}
	};

	const draw = () => {
		const css = getComputedStyle(el);
		const c = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
		const s = scale;
		ctx.clearRect(0, 0, W * s, H * s);

		// faint grid
		ctx.strokeStyle = c('--border', '#e7e3db');
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let gx = 0.5; gx < W; gx += 0.5) {
			ctx.moveTo(gx * s, 0);
			ctx.lineTo(gx * s, H * s);
		}
		for (let gy = 0.5; gy < H; gy += 0.5) {
			ctx.moveTo(0, gy * s);
			ctx.lineTo(W * s, gy * s);
		}
		ctx.stroke();

		// walls
		ctx.fillStyle = c('--fg', '#1d1c1a');
		for (const r of WALLS.slice(4)) {
			ctx.beginPath();
			ctx.roundRect(r.x * s, r.y * s, r.w * s, r.h * s, 0.08 * s);
			ctx.fill();
		}

		// rays: redder when closer
		const accent = c('--accent', '#c94436');
		RAY_ANGLES.forEach((a, i) => {
			const d = rays[i];
			const ang = bot.th + a;
			ctx.globalAlpha = 0.25 + 0.6 * (1 - d / RAY_MAX);
			ctx.strokeStyle = accent;
			ctx.lineWidth = 2;
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.moveTo(bot.x * s, bot.y * s);
			ctx.lineTo((bot.x + Math.cos(ang) * d) * s, (bot.y + Math.sin(ang) * d) * s);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.beginPath();
			ctx.arc((bot.x + Math.cos(ang) * d) * s, (bot.y + Math.sin(ang) * d) * s, 3, 0, Math.PI * 2);
			ctx.fillStyle = accent;
			ctx.fill();
		});
		ctx.globalAlpha = 1;

		// Wheely (sprite faces up, i.e. -y, so rotate by +90°)
		if (sprite.complete && sprite.naturalWidth) {
			const w = R * 2.6 * s;
			const h = (w * 180) / 260;
			ctx.save();
			ctx.translate(bot.x * s, bot.y * s);
			ctx.rotate(bot.th + Math.PI / 2);
			ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
			ctx.restore();
		}
	};

	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

	const loop = (t: number) => {
		const dt = Math.min(0.05, (t - last) / 1000 || 0);
		last = t;
		step(dt);
		draw();
		raf = requestAnimationFrame(loop);
	};

	const start = () => {
		if (raf || reduceMotion || !visible || document.hidden) return;
		last = performance.now();
		raf = requestAnimationFrame(loop);
	};

	const stop = () => {
		cancelAnimationFrame(raf);
		raf = 0;
	};

	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		visible ? start() : stop();
	});
	io.observe(el);

	const onVisibility = () => (document.hidden ? stop() : start());
	document.addEventListener('visibilitychange', onVisibility);

	const ro = new ResizeObserver(resize);
	ro.observe(el);

	sprite.onload = () => {
		rays = RAY_ANGLES.map((a) => castRay(bot.x, bot.y, bot.th + a));
		draw();
	};

	return {
		destroy() {
			stop();
			io.disconnect();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			canvas.remove();
		},
	};
}
