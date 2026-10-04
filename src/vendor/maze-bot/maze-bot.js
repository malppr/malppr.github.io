//#region web/src/sim/params.ts
var DEG = Math.PI / 180;
function simParams(d = {}) {
	const rayAnglesDeg = (d.ray_angles_deg ?? [
		-60,
		-30,
		0,
		30,
		60
	]).map(Number);
	return {
		radius: d.radius ?? .3,
		wheelBase: d.wheel_base ?? .6,
		vMax: d.v_max ?? 1.2,
		reverseMax: d.reverse_max ?? 0,
		dt: d.dt ?? 1 / 30,
		frameSkip: d.frame_skip ?? 2,
		rayAnglesDeg,
		rayAngles: rayAnglesDeg.map((a) => a * DEG),
		rayRange: d.ray_range ?? 3,
		goalDistScale: d.goal_dist_scale ?? 10,
		goalRadius: d.goal_radius ?? .35,
		goalInputs: d.goal_inputs ?? "sincos_dist",
		prevActionInputs: d.prev_action_inputs ?? false
	};
}
function goalDim(p) {
	return {
		sincos_dist: 3,
		sincos: 2,
		bearing: 1
	}[p.goalInputs];
}
function obsDim(p) {
	return p.rayAngles.length + goalDim(p) + (p.prevActionInputs ? 2 : 0);
}
/** Human-readable input names, in order (mazebot/policy.py:obs_spec, shortened for the network panel). */
function obsNames(p) {
	const goal = {
		sincos_dist: [
			"goal sin",
			"goal cos",
			"goal dist"
		],
		sincos: ["goal sin", "goal cos"],
		bearing: ["goal angle"]
	}[p.goalInputs];
	return [
		...p.rayAngles.map((_, i) => `ray ${i + 1}`),
		...goal,
		...p.prevActionInputs ? ["last L", "last R"] : []
	];
}
//#endregion
//#region web/src/sim/geometry.ts
var capCount = (caps) => caps.length / 5;
function capsules(rows) {
	const out = new Float64Array(rows.length * 5);
	rows.forEach((r, i) => {
		for (let k = 0; k < 5; k++) out[i * 5 + k] = r[k];
	});
	return out;
}
function concatCaps(...parts) {
	const out = new Float64Array(parts.reduce((n, p) => n + p.length, 0));
	let o = 0;
	for (const p of parts) {
		out.set(p, o);
		o += p.length;
	}
	return out;
}
/** Four capsules on the arena edges (their inner surface is `rad` inside the arena). */
function border(w, h, rad = .05) {
	return capsules([
		[
			0,
			0,
			w,
			0,
			rad
		],
		[
			w,
			0,
			w,
			h,
			rad
		],
		[
			w,
			h,
			0,
			h,
			rad
		],
		[
			0,
			h,
			0,
			0,
			rad
		]
	]);
}
/** Closest point on capsule i's core segment to (px, py) and the distance to it. Writes into `out`. */
function closestPoint(px, py, caps, i, out) {
	const o = i * 5;
	const ax = caps[o];
	const ay = caps[o + 1];
	const dx = caps[o + 2] - ax;
	const dy = caps[o + 3] - ay;
	const l2 = dx * dx + dy * dy;
	let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
	t = t < 0 ? 0 : t > 1 ? 1 : t;
	const cx = ax + t * dx;
	const cy = ay + t * dy;
	const ex = px - cx;
	const ey = py - cy;
	out[0] = cx;
	out[1] = cy;
	out[2] = Math.sqrt(ex * ex + ey * ey);
}
var tmp = /* @__PURE__ */ new Float64Array(3);
/** Distance from a point to the nearest capsule surface (negative inside a wall). */
function clearance(px, py, caps) {
	let best = Infinity;
	for (let i = 0, n = capCount(caps); i < n; i++) {
		closestPoint(px, py, caps, i, tmp);
		const c = tmp[2] - caps[i * 5 + 4];
		if (c < best) best = c;
	}
	return best;
}
function rayCircle(ox, oy, dx, dy, cx, cy, r) {
	const qx = ox - cx;
	const qy = oy - cy;
	const b = dx * qx + dy * qy;
	const c = qx * qx + qy * qy - r * r;
	const h = b * b - c;
	const t = -b - Math.sqrt(h > 0 ? h : 0);
	return h >= 0 && t > 0 ? t : Infinity;
}
/** First hit distance of one ray (unit direction dx, dy) on capsule i, Infinity on a miss (iq's capsule test). */
function rayCapsule(ox, oy, dx, dy, caps, i) {
	const o = i * 5;
	const ax = caps[o];
	const ay = caps[o + 1];
	const bx = caps[o + 2];
	const by = caps[o + 3];
	const rad = caps[o + 4];
	let t = Math.min(rayCircle(ox, oy, dx, dy, ax, ay, rad), rayCircle(ox, oy, dx, dy, bx, by, rad));
	const sx = bx - ax;
	const sy = by - ay;
	const oax = ox - ax;
	const oay = oy - ay;
	const baba = sx * sx + sy * sy;
	const bard = sx * dx + sy * dy;
	const baoa = sx * oax + sy * oay;
	const rdoa = dx * oax + dy * oay;
	const oaoa = oax * oax + oay * oay;
	const a = baba - bard * bard;
	const b = baba * rdoa - baoa * bard;
	const c = baba * oaoa - baoa * baoa - rad * rad * baba;
	const h = b * b - a * c;
	let ok = a > 1e-12 && h >= 0;
	const tb = (-b - Math.sqrt(h > 0 ? h : 0)) / (ok ? a : 1);
	const y = baoa + tb * bard;
	ok = ok && tb > 0 && y > 0 && y < baba;
	if (ok && tb < t) t = tb;
	return t;
}
/** Distance along each unit direction (dirs = [dx0, dy0, dx1, dy1, ...]) to the first hit, capped at maxRange. */
function castRays(ox, oy, dirs, caps, maxRange) {
	const k = dirs.length / 2;
	const out = new Float64Array(k);
	const n = capCount(caps);
	for (let r = 0; r < k; r++) {
		const dx = dirs[2 * r];
		const dy = dirs[2 * r + 1];
		let best = Infinity;
		for (let i = 0; i < n; i++) {
			const t = rayCapsule(ox, oy, dx, dy, caps, i);
			if (t < best) best = t;
		}
		out[r] = Math.min(best, maxRange);
	}
	return out;
}
/**
* Move a circle of radius r at (px, py) out of any capsule it overlaps. Each iteration resolves the deepest
* overlap (first index on ties) along its contact normal, so the robot slides along walls.
*/
function pushOut(px, py, r, caps, iters = 4) {
	let contact = false;
	const n = capCount(caps);
	if (n === 0) return {
		x: px,
		y: py,
		contact
	};
	for (let it = 0; it < iters; it++) {
		let bi = 0;
		let bp = -Infinity;
		let bcx = 0;
		let bcy = 0;
		let bd = 0;
		for (let i = 0; i < n; i++) {
			closestPoint(px, py, caps, i, tmp);
			const pen = r + caps[i * 5 + 4] - tmp[2];
			if (pen > bp) {
				bp = pen;
				bi = i;
				bcx = tmp[0];
				bcy = tmp[1];
				bd = tmp[2];
			}
		}
		if (bp <= 0) break;
		contact = true;
		let nx;
		let ny;
		if (bd > 1e-12) {
			nx = (px - bcx) / bd;
			ny = (py - bcy) / bd;
		} else {
			const o = bi * 5;
			const sx = caps[o + 2] - caps[o];
			const sy = caps[o + 3] - caps[o + 1];
			const ln = Math.sqrt(sx * sx + sy * sy);
			if (ln > 0) {
				nx = -sy / ln;
				ny = sx / ln;
			} else {
				nx = 1;
				ny = 0;
			}
		}
		px = px + nx * bp;
		py = py + ny * bp;
	}
	return {
		x: px,
		y: py,
		contact
	};
}
/** Ramer-Douglas-Peucker polyline simplification. points: [[x, y], ...]. */
function rdp(points, eps) {
	const n = points.length;
	if (n < 3) return points.map((p) => [p[0], p[1]]);
	const keep = new Uint8Array(n);
	keep[0] = keep[n - 1] = 1;
	const seg = /* @__PURE__ */ new Float64Array(5);
	const stack = [[0, n - 1]];
	while (stack.length) {
		const [i, j] = stack.pop();
		if (j <= i + 1) continue;
		seg.set([
			points[i][0],
			points[i][1],
			points[j][0],
			points[j][1],
			0
		]);
		let k = -1;
		let dk = -Infinity;
		for (let m = i + 1; m < j; m++) {
			closestPoint(points[m][0], points[m][1], seg, 0, tmp);
			if (tmp[2] > dk) {
				dk = tmp[2];
				k = m;
			}
		}
		if (dk > eps) {
			keep[k] = 1;
			stack.push([i, k], [k, j]);
		}
	}
	return points.filter((_, m) => keep[m]).map((p) => [p[0], p[1]]);
}
/** Chain of capsules along a polyline (consecutive points); a single point becomes a post. */
function polylineCapsules(points, rad) {
	if (points.length === 1) return capsules([[
		points[0][0],
		points[0][1],
		points[0][0],
		points[0][1],
		rad
	]]);
	const rows = [];
	for (let i = 0; i + 1 < points.length; i++) rows.push([
		points[i][0],
		points[i][1],
		points[i + 1][0],
		points[i + 1][1],
		rad
	]);
	return capsules(rows);
}
//#endregion
//#region web/src/sim/grid.ts
var SQRT2 = Math.sqrt(2);
var NEIGHBOURS = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1]
];
var DIAGONALS = [
	[-1, -1],
	[1, -1],
	[-1, 1],
	[1, 1]
];
function buildGrid(width, height, caps, robotRadius, cell = robotRadius / 2) {
	const nx = Math.max(1, Math.ceil(width / cell));
	const ny = Math.max(1, Math.ceil(height / cell));
	const free = new Uint8Array(nx * ny);
	const clear = new Float64Array(nx * ny);
	const n = capCount(caps);
	for (let j = 0; j < ny; j++) {
		const py = (j + .5) * cell;
		for (let i = 0; i < nx; i++) {
			const px = (i + .5) * cell;
			let best = Infinity;
			for (let k = 0; k < n; k++) {
				const o = k * 5;
				const ax = caps[o];
				const ay = caps[o + 1];
				const dx = caps[o + 2] - ax;
				const dy = caps[o + 3] - ay;
				const l2 = dx * dx + dy * dy;
				let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
				t = t < 0 ? 0 : t > 1 ? 1 : t;
				const ex = px - (ax + t * dx);
				const ey = py - (ay + t * dy);
				const c = Math.sqrt(ex * ex + ey * ey) - caps[o + 4];
				if (c < best) best = c;
			}
			clear[j * nx + i] = best;
			free[j * nx + i] = best >= robotRadius && px < width && py < height ? 1 : 0;
		}
	}
	return {
		width,
		height,
		cell,
		nx,
		ny,
		free,
		clear
	};
}
function cellIndex(g, x, y) {
	return [Math.min(Math.max(Math.trunc(x / g.cell), 0), g.nx - 1), Math.min(Math.max(Math.trunc(y / g.cell), 0), g.ny - 1)];
}
/** Binary min-heap of (d, i, j), ordered like Python tuples (heapq). */
var Heap = class {
	d = [];
	i = [];
	j = [];
	get size() {
		return this.d.length;
	}
	less(a, b) {
		const { d, i, j } = this;
		return d[a] < d[b] || d[a] === d[b] && (i[a] < i[b] || i[a] === i[b] && j[a] < j[b]);
	}
	swap(a, b) {
		for (const arr of [
			this.d,
			this.i,
			this.j
		]) [arr[a], arr[b]] = [arr[b], arr[a]];
	}
	push(d, i, j) {
		this.d.push(d);
		this.i.push(i);
		this.j.push(j);
		let k = this.d.length - 1;
		while (k > 0) {
			const p = k - 1 >> 1;
			if (!this.less(k, p)) break;
			this.swap(k, p);
			k = p;
		}
	}
	pop() {
		const top = [
			this.d[0],
			this.i[0],
			this.j[0]
		];
		const last = this.d.length - 1;
		this.swap(0, last);
		this.d.pop();
		this.i.pop();
		this.j.pop();
		let k = 0;
		for (;;) {
			const l = 2 * k + 1;
			const r = l + 1;
			let m = k;
			if (l < last && this.less(l, m)) m = l;
			if (r < last && this.less(r, m)) m = r;
			if (m === k) break;
			this.swap(k, m);
			k = m;
		}
		return top;
	}
};
/**
* Geodesic distance (world units) from (gx, gy) to every free cell; Infinity where unreachable. 8-connected,
* diagonal moves only when both orthogonal neighbours are free. Seeds every free cell within `seedRadius`
* (default 1.5 cells) of the point, so the field is ~0 at the goal even if the goal's own cell is blocked.
*/
function geodesicField(g, gx, gy, seedRadius = 1.5 * g.cell) {
	const { nx, ny, cell: c, free } = g;
	const dist = new Float64Array(nx * ny).fill(Infinity);
	const heap = new Heap();
	const [i0, j0] = cellIndex(g, gx, gy);
	const k = Math.ceil(seedRadius / c) + 1;
	for (let j = Math.max(0, j0 - k); j < Math.min(ny, j0 + k + 1); j++) for (let i = Math.max(0, i0 - k); i < Math.min(nx, i0 + k + 1); i++) {
		if (!free[j * nx + i]) continue;
		const ex = (i + .5) * c - gx;
		const ey = (j + .5) * c - gy;
		const d = Math.sqrt(ex * ex + ey * ey);
		if (d <= seedRadius && d < dist[j * nx + i]) {
			dist[j * nx + i] = d;
			heap.push(d, i, j);
		}
	}
	const diag = SQRT2 * c;
	while (heap.size) {
		const [d, i, j] = heap.pop();
		if (d > dist[j * nx + i]) continue;
		for (const [di, dj] of NEIGHBOURS) {
			const a = i + di;
			const b = j + dj;
			if (a >= 0 && a < nx && b >= 0 && b < ny && free[b * nx + a]) {
				const nd = d + 1 * c;
				if (nd < dist[b * nx + a]) {
					dist[b * nx + a] = nd;
					heap.push(nd, a, b);
				}
			}
		}
		for (const [di, dj] of DIAGONALS) {
			const a = i + di;
			const b = j + dj;
			if (a >= 0 && a < nx && b >= 0 && b < ny && free[b * nx + a] && free[j * nx + a] && free[b * nx + i]) {
				const nd = d + diag;
				if (nd < dist[b * nx + a]) {
					dist[b * nx + a] = nd;
					heap.push(nd, a, b);
				}
			}
		}
	}
	return dist;
}
/** Continuous geodesic distance at (x, y): min over nearby reached cells of field + straight line. */
function lookup(g, dist, x, y, k = 2) {
	const [i0, j0] = cellIndex(g, x, y);
	const c = g.cell;
	let best = Infinity;
	for (let j = Math.max(0, j0 - k); j < Math.min(g.ny, j0 + k + 1); j++) for (let i = Math.max(0, i0 - k); i < Math.min(g.nx, i0 + k + 1); i++) {
		const d = dist[j * g.nx + i];
		if (d < Infinity) {
			const ex = (i + .5) * c - x;
			const ey = (j + .5) * c - y;
			const v = d + Math.sqrt(ex * ex + ey * ey);
			if (v < best) best = v;
		}
	}
	return best;
}
function reachable(g, ax, ay, bx, by) {
	return lookup(g, geodesicField(g, bx, by), ax, ay) < Infinity;
}
//#endregion
//#region web/src/sim/sim.ts
var TWO_PI = 2 * Math.PI;
var BORDER_RAD = .05;
/** Wrap to (-pi, pi]. JS % on doubles is C fmod, like Python's math.fmod. */
function wrapAngle(a) {
	a = (a + Math.PI) % TWO_PI;
	if (a <= 0) a += TWO_PI;
	return a - Math.PI;
}
/**
* Advance one physics step in place; returns whether the robot touched a wall. Differential drive with the
* body speed floored at -reverseMax * vMax; midpoint integration, sub-stepped so the centre never moves more
* than r/2 per sub-step.
*/
function physicsStep(s, ul, ur, caps, p) {
	const v = Math.max(p.vMax * .5 * (ul + ur), -p.reverseMax * p.vMax);
	const w = p.vMax * (ul - ur) / p.wheelBase;
	const n = Math.max(1, Math.ceil(Math.abs(v) * p.dt / (.5 * p.radius)));
	const h = p.dt / n;
	let { x, y, th } = s;
	let contact = false;
	for (let k = 0; k < n; k++) {
		const tm = th + .5 * w * h;
		x = x + v * Math.cos(tm) * h;
		y = y + v * Math.sin(tm) * h;
		th = wrapAngle(th + w * h);
		const r = pushOut(x, y, p.radius, caps);
		x = r.x;
		y = r.y;
		contact = contact || r.contact;
	}
	s.x = x;
	s.y = y;
	s.th = th;
	return contact;
}
function rayDirs(th, p) {
	const d = new Float64Array(2 * p.rayAngles.length);
	p.rayAngles.forEach((a, i) => {
		d[2 * i] = Math.cos(th + a);
		d[2 * i + 1] = Math.sin(th + a);
	});
	return d;
}
/**
* Sensor part of the observation (rays / range, then goal inputs; the episode appends the memory inputs).
* Bearing via dot/cross products: sin > 0 means the goal is clockwise (to the right on screen).
*/
function observe(x, y, th, gx, gy, caps, p) {
	const rays = castRays(x, y, rayDirs(th, p), caps, p.rayRange);
	const hx = Math.cos(th);
	const hy = Math.sin(th);
	const ex = gx - x;
	const ey = gy - y;
	const dist = Math.sqrt(ex * ex + ey * ey);
	let cosB = 1;
	let sinB = 0;
	if (dist > 1e-9) {
		const ux = ex / dist;
		const uy = ey / dist;
		cosB = hx * ux + hy * uy;
		sinB = hx * uy - hy * ux;
	}
	const k = p.rayAngles.length;
	const obs = new Float64Array(k + goalDim(p));
	for (let i = 0; i < k; i++) obs[i] = rays[i] / p.rayRange;
	if (p.goalInputs === "bearing") obs[k] = Math.atan2(sinB, cosB) / Math.PI;
	else {
		obs[k] = sinB;
		obs[k + 1] = cosB;
		if (p.goalInputs === "sincos_dist") obs[k + 2] = Math.min(dist / p.goalDistScale, 1);
	}
	return {
		obs,
		rays
	};
}
function goalDistance(x, y, gx, gy) {
	const ex = gx - x;
	const ey = gy - y;
	return Math.sqrt(ex * ex + ey * ey);
}
/** All capsules of a map: the arena border first, then the walls (same order as mapgen.Map.caps). */
function mapCaps(m) {
	return concatCaps(border(m.width, m.height, BORDER_RAD), capsules(m.walls));
}
var TIMEOUT = {
	factor: 3,
	slack: 10
};
/**
* One drive from A to B (mirrors MazeEnv.reset/step without rewards). `observation()` is exactly what the
* Python policy saw: float32-rounded, with the previous clipped action appended when the sim uses memory.
*/
var Episode = class {
	timeout;
	p;
	map;
	caps;
	grid;
	field;
	pose = {
		x: 0,
		y: 0,
		th: 0
	};
	rays = /* @__PURE__ */ new Float64Array(0);
	sensors = /* @__PURE__ */ new Float64Array(0);
	prevAction = [0, 0];
	steps = 0;
	maxSteps = 0;
	geo0 = Infinity;
	done = null;
	constructor(map, p, timeout = TIMEOUT) {
		this.timeout = timeout;
		this.p = p;
		this.map = map;
		this.setMap(map);
	}
	/** Swap in a new layout (walls / A / B) and restart. */
	setMap(map) {
		this.map = map;
		this.caps = mapCaps(map);
		this.grid = buildGrid(map.width, map.height, this.caps, this.p.radius);
		this.field = geodesicField(this.grid, map.goal[0], map.goal[1]);
		this.reset();
	}
	/**
	* Change walls mid-drive (demo drawing): Wheely keeps its pose and memory. With `replan`, the path grid
	* is rebuilt and the time limit extended to cover the path from where Wheely is now. Returns whether B
	* is reachable from Wheely's position (only meaningful with `replan`).
	*/
	updateWalls(walls, replan) {
		this.map = {
			...this.map,
			walls
		};
		this.caps = mapCaps(this.map);
		this.sense();
		if (!replan) return this.reachable;
		this.grid = buildGrid(this.map.width, this.map.height, this.caps, this.p.radius);
		this.field = geodesicField(this.grid, this.map.goal[0], this.map.goal[1]);
		const geo = lookup(this.grid, this.field, this.pose.x, this.pose.y);
		this.geo0 = geo;
		this.maxSteps = Math.max(this.maxSteps === Infinity ? 0 : this.maxSteps, this.steps + this.limitSteps(geo, this.pose));
		return geo < Infinity;
	}
	/** Policy steps allowed for a path of length `geo` (no path: straight-line distance, so "lost" still happens). */
	limitSteps(geo, from) {
		const d = geo < Infinity ? geo : goalDistance(from.x, from.y, this.map.goal[0], this.map.goal[1]);
		const limitS = this.timeout.factor * d / this.p.vMax + this.timeout.slack;
		return Math.ceil(limitS / (this.p.dt * this.p.frameSkip));
	}
	reset() {
		const [x, y, th] = this.map.start;
		this.pose = {
			x,
			y,
			th
		};
		this.geo0 = lookup(this.grid, this.field, x, y);
		this.maxSteps = this.limitSteps(this.geo0, this.pose);
		this.steps = 0;
		this.prevAction = [0, 0];
		this.done = null;
		this.sense();
	}
	get reachable() {
		return this.geo0 < Infinity;
	}
	/** Is B reachable from (x, y) with the current walls (as of the last grid rebuild)? */
	reachableFrom(x, y) {
		return lookup(this.grid, this.field, x, y) < Infinity;
	}
	sense() {
		const { x, y, th } = this.pose;
		const r = observe(x, y, th, this.map.goal[0], this.map.goal[1], this.caps, this.p);
		this.sensors = r.obs;
		this.rays = r.rays;
	}
	/** Policy input: sensors (+ previous action), rounded to float32 like the Python env. */
	observation() {
		const n = obsDim(this.p);
		const o = new Float64Array(n);
		for (let i = 0; i < this.sensors.length; i++) o[i] = Math.fround(this.sensors[i]);
		if (this.p.prevActionInputs) {
			o[n - 2] = Math.fround(this.prevAction[0]);
			o[n - 1] = Math.fround(this.prevAction[1]);
		}
		return o;
	}
	/** One policy step: frameSkip physics steps, stopping early on reaching B. */
	step(action) {
		const clip = (a) => a < -1 ? -1 : a > 1 ? 1 : a;
		const ul = clip(action[0]);
		const ur = clip(action[1]);
		const p = this.p;
		let contact = false;
		let success = false;
		for (let k = 0; k < p.frameSkip; k++) {
			contact = physicsStep(this.pose, ul, ur, this.caps, p) || contact;
			if (goalDistance(this.pose.x, this.pose.y, this.map.goal[0], this.map.goal[1]) < p.goalRadius) {
				success = true;
				break;
			}
		}
		this.steps += 1;
		this.prevAction = [ul, ur];
		this.sense();
		const lost = !success && this.steps >= this.maxSteps;
		if (success) this.done = "success";
		else if (lost) this.done = "lost";
		return {
			success,
			lost,
			contact
		};
	}
};
//#endregion
//#region web/src/sim/presets.ts
var PRESETS = {
	version: 1,
	note: "Landscape, world units, x right, y down. Portrait = swap x, y. Walls: [ax, ay, bx, by, rad].",
	presets: [
		{
			"width": 10,
			"height": 6.25,
			"name": "Open field",
			"walls": [],
			"start": [
				1.2,
				3.125,
				0
			],
			"goal": [8.8, 3.125]
		},
		{
			"width": 10,
			"height": 6.25,
			"name": "Posts",
			"walls": [
				[
					2.6,
					1.6,
					2.6,
					1.6,
					.35
				],
				[
					3.4,
					4.3,
					3.4,
					4.3,
					.45
				],
				[
					4.8,
					2.6,
					4.8,
					2.6,
					.3
				],
				[
					5.6,
					5,
					5.6,
					5,
					.3
				],
				[
					6.4,
					1.3,
					6.4,
					1.3,
					.4
				],
				[
					7.2,
					3.6,
					7.2,
					3.6,
					.45
				],
				[
					8.4,
					1.9,
					8.4,
					1.9,
					.25
				],
				[
					1.6,
					4.9,
					1.6,
					4.9,
					.3
				]
			],
			"start": [
				.9,
				1,
				.4
			],
			"goal": [9.1, 5.3]
		},
		{
			"width": 10,
			"height": 6.25,
			"name": "Slalom",
			"walls": [
				[
					2.5,
					0,
					2.5,
					4.2,
					.1
				],
				[
					5,
					2.05,
					5,
					6.25,
					.1
				],
				[
					7.5,
					0,
					7.5,
					4.2,
					.1
				]
			],
			"start": [
				1.1,
				1.2,
				1.5708
			],
			"goal": [8.9, 1.2]
		},
		{
			"width": 10,
			"height": 6.25,
			"name": "Rooms",
			"walls": [
				[
					3.4,
					0,
					3.4,
					2.2,
					.1
				],
				[
					3.4,
					3.6,
					3.4,
					6.25,
					.1
				],
				[
					6.6,
					0,
					6.6,
					3.9,
					.1
				],
				[
					6.6,
					5.2,
					6.6,
					6.25,
					.1
				],
				[
					3.4,
					2.2,
					4.6,
					2.2,
					.1
				],
				[
					5,
					3.4,
					5,
					6.25,
					.1
				]
			],
			"start": [
				1.4,
				1.2,
				0
			],
			"goal": [8.6, 1.4]
		},
		{
			"width": 10,
			"height": 6.25,
			"name": "Small maze",
			"walls": [
				[
					1.6588,
					0,
					1.637,
					.5208,
					.08
				],
				[
					1.637,
					.5208,
					1.6946,
					1.0417,
					.08
				],
				[
					1.6946,
					1.0417,
					1.6681,
					1.5625,
					.08
				],
				[
					1.666,
					1.5625,
					1.7012,
					2.0833,
					.08
				],
				[
					1.7012,
					2.0833,
					1.7027,
					2.6042,
					.08
				],
				[
					1.7027,
					2.6042,
					1.6476,
					3.125,
					.08
				],
				[
					3.3275,
					1.5625,
					3.2572,
					2.0833,
					.08
				],
				[
					3.2572,
					2.0833,
					3.3098,
					2.6042,
					.08
				],
				[
					3.3098,
					2.6042,
					3.3344,
					3.125,
					.08
				],
				[
					6.6734,
					1.5625,
					6.6338,
					2.0833,
					.08
				],
				[
					6.6338,
					2.0833,
					6.6766,
					2.6042,
					.08
				],
				[
					6.6766,
					2.6042,
					6.6508,
					3.125,
					.08
				],
				[
					3.3365,
					3.125,
					3.3459,
					3.6458,
					.08
				],
				[
					3.3459,
					3.6458,
					3.3146,
					4.1667,
					.08
				],
				[
					3.3146,
					4.1667,
					3.3317,
					4.6875,
					.08
				],
				[
					8.3383,
					4.6875,
					8.3246,
					5.2083,
					.08
				],
				[
					8.3246,
					5.2083,
					8.2752,
					5.7292,
					.08
				],
				[
					8.2752,
					5.7292,
					8.3355,
					6.25,
					.08
				],
				[
					3.3333,
					1.5766,
					3.8889,
					1.5791,
					.08
				],
				[
					3.8889,
					1.5791,
					4.4444,
					1.5435,
					.08
				],
				[
					4.4444,
					1.5435,
					5,
					1.5439,
					.08
				],
				[
					5,
					1.5664,
					5.5556,
					1.6003,
					.08
				],
				[
					5.5556,
					1.6003,
					6.1111,
					1.5482,
					.08
				],
				[
					6.1111,
					1.5482,
					6.6667,
					1.5789,
					.08
				],
				[
					6.6667,
					1.5629,
					7.2222,
					1.5354,
					.08
				],
				[
					7.2222,
					1.5354,
					7.7778,
					1.5735,
					.08
				],
				[
					7.7778,
					1.5735,
					8.3333,
					1.5581,
					.08
				],
				[
					5,
					3.1104,
					5.5556,
					3.1103,
					.08
				],
				[
					5.5556,
					3.1103,
					6.1111,
					3.1298,
					.08
				],
				[
					6.1111,
					3.1298,
					6.6667,
					3.1137,
					.08
				],
				[
					6.6667,
					3.131,
					7.2222,
					3.1158,
					.08
				],
				[
					7.2222,
					3.1158,
					7.7778,
					3.1064,
					.08
				],
				[
					7.7778,
					3.1064,
					8.3333,
					3.1194,
					.08
				],
				[
					1.6667,
					4.6737,
					2.2222,
					4.6785,
					.08
				],
				[
					2.2222,
					4.6785,
					2.7778,
					4.6749,
					.08
				],
				[
					2.7778,
					4.6749,
					3.3333,
					4.6888,
					.08
				],
				[
					3.3333,
					4.6775,
					3.8889,
					4.7487,
					.08
				],
				[
					3.8889,
					4.7487,
					4.4444,
					4.6928,
					.08
				],
				[
					4.4444,
					4.6928,
					5,
					4.6754,
					.08
				],
				[
					5,
					4.6884,
					5.5556,
					4.7059,
					.08
				],
				[
					5.5556,
					4.7059,
					6.1111,
					4.6472,
					.08
				],
				[
					6.1111,
					4.6472,
					6.6667,
					4.6939,
					.08
				]
			],
			"start": [
				.8,
				.8,
				0
			],
			"goal": [9.2, 5.45]
		},
		{
			"width": 10,
			"height": 6.25,
			"name": "The trap",
			"walls": [
				[
					4.4,
					1.6,
					6.6,
					1.6,
					.1
				],
				[
					6.6,
					1.6,
					6.6,
					4.65,
					.1
				],
				[
					6.6,
					4.65,
					4.4,
					4.65,
					.1
				]
			],
			"start": [
				1.4,
				3.125,
				0
			],
			"goal": [8.4, 3.125]
		}
	]
}.presets;
/** Port of mapgen.preset_map: portrait swaps x/y of every point and maps heading th to pi/2 - th. */
function presetMap(p, portrait = false) {
	const [sx, sy, sth] = p.start;
	const [gx, gy] = p.goal;
	if (!portrait) return {
		name: p.name,
		width: p.width,
		height: p.height,
		walls: p.walls.map((w) => [...w]),
		start: [
			sx,
			sy,
			sth
		],
		goal: [gx, gy]
	};
	return {
		name: p.name,
		width: p.height,
		height: p.width,
		walls: p.walls.map((w) => [
			w[1],
			w[0],
			w[3],
			w[2],
			w[4]
		]),
		start: [
			sy,
			sx,
			Math.PI / 2 - sth
		],
		goal: [gy, gx]
	};
}
//#endregion
//#region web/src/policy/mlp.ts
var MLPPolicy = class {
	arch;
	sim;
	W;
	b;
	constructor(w) {
		this.W = w.W.map((M) => Float64Array.from(M.flat()));
		this.b = w.b.map((v) => Float64Array.from(v));
		this.arch = [w.W[0][0].length, ...w.W.map((M) => M.length)];
		this.sim = simParams(w.sim_params);
	}
	/** Weight from neuron i of layer k to neuron j of layer k + 1. */
	weight(k, j, i) {
		return this.W[k][j * this.arch[k] + i];
	}
	forward(obs) {
		let h = Float64Array.from(obs);
		const layers = [h];
		const last = this.W.length - 1;
		for (let k = 0; k <= last; k++) {
			const nIn = this.arch[k];
			const nOut = this.arch[k + 1];
			const W = this.W[k];
			const out = new Float64Array(nOut);
			for (let j = 0; j < nOut; j++) {
				let s = 0;
				for (let i = 0; i < nIn; i++) s += W[j * nIn + i] * h[i];
				s += this.b[k][j];
				out[j] = k < last ? Math.tanh(s) : s;
			}
			h = out;
			layers.push(h);
		}
		const clip = (a) => a < -1 ? -1 : a > 1 ? 1 : a;
		return {
			action: [clip(h[0]), clip(h[1])],
			layers
		};
	}
	reset() {}
};
//#endregion
//#region web/src/policy/heuristic.ts
var clip = (a, lo, hi) => a < lo ? lo : a > hi ? hi : a;
var HeuristicPolicy = class {
	sim = simParams();
	arch = null;
	act(obs) {
		const f = Math.fround;
		const p = this.sim;
		const rays = [
			0,
			1,
			2,
			3,
			4
		].map((i) => f(obs[i] * f(p.rayRange)));
		const bearing = Math.atan2(obs[5], obs[6]);
		const left = Math.min(rays[0], rays[1]);
		const right = Math.min(rays[3], rays[4]);
		const front = Math.min(rays[1], rays[2], rays[3]);
		let rule = "seek";
		let turn = clip(1.5 * bearing, -1, 1);
		let t32 = false;
		if (turn > 0 && right < f(.7)) {
			const t = f(f(right - .5) * 2);
			if (t < turn) {
				turn = t;
				t32 = true;
				rule = "keep-wall-right";
			}
		}
		if (turn < 0 && left < f(.7)) {
			const t = -f(f(left - .5) * 2);
			if (t > turn) {
				turn = t;
				t32 = true;
				rule = "keep-wall-left";
			}
		}
		if (front < 1) {
			const side = right > left ? 1 : -1;
			const m = f(f(.4) + f(1 - front));
			turn = side * Math.min(1, m);
			t32 = m < 1;
			rule = "avoid";
		}
		const go = clip(f(f(front - f(.4)) / f(.8)), 0, 1);
		let speed;
		let ul;
		let ur;
		if (t32) {
			speed = f(go * f(1 - f(.5 * Math.abs(turn))));
			const k = f(f(.6) * turn);
			ul = clip(f(speed + k), -1, 1);
			ur = clip(f(speed - k), -1, 1);
		} else {
			speed = go * (1 - .5 * Math.abs(turn));
			ul = clip(speed + .6 * turn, -1, 1);
			ur = clip(speed - .6 * turn, -1, 1);
		}
		return {
			action: [ul, ur],
			trace: {
				left,
				right,
				front,
				bearing,
				rule,
				turn,
				speed
			}
		};
	}
	reset() {}
};
//#endregion
//#region web/src/demo/theme.ts
var FALLBACK = {
	fg: "#1d1c1a",
	bg: "#fbfaf7",
	surface: "#ffffff",
	border: "#e7e3db",
	muted: "#67635c",
	accent: "#c94436",
	accentFg: "#ffffff",
	neg: "#2862cf",
	sans: "system-ui, sans-serif",
	mono: "ui-monospace, monospace"
};
function readTheme(el) {
	const cs = getComputedStyle(el);
	const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
	return {
		fg: v("--fg", FALLBACK.fg),
		bg: v("--bg", FALLBACK.bg),
		surface: v("--surface", FALLBACK.surface),
		border: v("--border", FALLBACK.border),
		muted: v("--muted", FALLBACK.muted),
		accent: v("--accent", FALLBACK.accent),
		accentFg: v("--accent-fg", FALLBACK.accentFg),
		neg: v("--ai", FALLBACK.neg),
		sans: cs.fontFamily || FALLBACK.sans,
		mono: v("--font-mono", FALLBACK.mono)
	};
}
/** Call `cb` when the page theme may have changed (class / data-theme / style on <html>, or the OS scheme). */
function watchTheme(cb) {
	const mo = new MutationObserver(cb);
	mo.observe(document.documentElement, {
		attributes: true,
		attributeFilter: [
			"class",
			"data-theme",
			"style"
		]
	});
	const mq = matchMedia("(prefers-color-scheme: dark)");
	mq.addEventListener("change", cb);
	return () => {
		mo.disconnect();
		mq.removeEventListener("change", cb);
	};
}
/** Parse a CSS colour to [r, g, b] (any format the browser understands). */
var probe = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
function rgb(color) {
	if (!probe) return [
		0,
		0,
		0
	];
	probe.fillStyle = "#000";
	probe.fillStyle = color;
	const s = probe.fillStyle;
	if (s.startsWith("#")) return [
		parseInt(s.slice(1, 3), 16),
		parseInt(s.slice(3, 5), 16),
		parseInt(s.slice(5, 7), 16)
	];
	const m = s.match(/[\d.]+/g) ?? [
		"0",
		"0",
		"0"
	];
	return [
		Number(m[0]),
		Number(m[1]),
		Number(m[2])
	];
}
/** Mix two colours: t = 0 gives a, t = 1 gives b. */
function mix(a, b, t) {
	const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
	return `rgb(${c[0]},${c[1]},${c[2]})`;
}
//#endregion
//#region web/src/demo/arena.ts
var MAX_DPR$1 = 2;
var ArenaView = class {
	canvas;
	ctx;
	sprite = null;
	w = 10;
	h = 6.25;
	scale = 1;
	theme;
	constructor(canvas, spriteUrl) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		if (spriteUrl) {
			const img = new Image();
			img.decoding = "async";
			img.onload = () => this.sprite = img;
			img.src = spriteUrl;
		}
	}
	setWorld(width, height) {
		this.w = width;
		this.h = height;
		this.canvas.style.aspectRatio = `${width} / ${height}`;
		this.resize();
	}
	resize() {
		const cssW = this.canvas.clientWidth || 1;
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR$1);
		this.scale = cssW / this.w;
		const pxW = Math.round(cssW * dpr);
		const pxH = Math.round(cssW * this.h * dpr / this.w);
		if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
			this.canvas.width = pxW;
			this.canvas.height = pxH;
		}
		this.ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);
	}
	toWorld(clientX, clientY) {
		const r = this.canvas.getBoundingClientRect();
		return [(clientX - r.left) / r.width * this.w, (clientY - r.top) / r.height * this.h];
	}
	draw(f) {
		const { ctx, theme: t } = this;
		const px = 1 / this.scale;
		const { map } = f;
		ctx.fillStyle = t.surface;
		ctx.fillRect(0, 0, this.w, this.h);
		if (f.trace.length >= 4) {
			ctx.beginPath();
			ctx.moveTo(f.trace[0], f.trace[1]);
			for (let i = 2; i < f.trace.length; i += 2) ctx.lineTo(f.trace[i], f.trace[i + 1]);
			ctx.strokeStyle = t.accent;
			ctx.globalAlpha = .45;
			ctx.lineWidth = Math.max(.05, 2 * px);
			ctx.lineJoin = "round";
			ctx.stroke();
			ctx.globalAlpha = 1;
		}
		ctx.strokeStyle = t.fg;
		ctx.fillStyle = t.fg;
		ctx.lineCap = "round";
		ctx.globalAlpha = .85;
		for (const w of map.walls) this.capsule(w);
		if (f.stroke && f.stroke.length) {
			ctx.globalAlpha = .5;
			for (let i = 0; i < f.stroke.length; i++) {
				const a = f.stroke[Math.max(0, i - 1)];
				const b = f.stroke[i];
				this.capsule([
					a[0],
					a[1],
					b[0],
					b[1],
					f.brush
				]);
			}
		}
		ctx.globalAlpha = 1;
		const { x, y, th } = f.pose;
		ctx.lineCap = "butt";
		ctx.strokeStyle = t.muted;
		ctx.globalAlpha = .45;
		ctx.lineWidth = Math.max(.02, px);
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(map.goal[0], map.goal[1]);
		ctx.stroke();
		ctx.globalAlpha = 1;
		const muted = rgb(t.muted);
		const accent = rgb(t.accent);
		ctx.setLineDash([.09, .07]);
		ctx.lineWidth = Math.max(.03, 1.5 * px);
		f.rayAngles.forEach((a, i) => {
			const d = f.rays[i];
			ctx.strokeStyle = mix(muted, accent, .25 + .75 * (1 - d / f.rayRange));
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + d * Math.cos(th + a), y + d * Math.sin(th + a));
			ctx.stroke();
		});
		ctx.setLineDash([]);
		this.marker(map.start[0], map.start[1], "A", false, f.grab === "A");
		this.marker(map.goal[0], map.goal[1], "B", true, f.grab === "B");
		this.robot(x, y, th, f.radius);
		if (f.eraser) {
			ctx.strokeStyle = t.fg;
			ctx.lineWidth = px;
			ctx.setLineDash([4 * px, 3 * px]);
			ctx.beginPath();
			ctx.arc(f.eraser.x, f.eraser.y, f.eraser.r, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.setLineDash([]);
		}
		ctx.strokeStyle = t.fg;
		ctx.lineWidth = .1;
		ctx.strokeRect(0, 0, this.w, this.h);
	}
	capsule(w) {
		const { ctx } = this;
		if (w[0] === w[2] && w[1] === w[3]) {
			ctx.beginPath();
			ctx.arc(w[0], w[1], w[4], 0, 2 * Math.PI);
			ctx.fill();
			return;
		}
		ctx.lineWidth = 2 * w[4];
		ctx.beginPath();
		ctx.moveTo(w[0], w[1]);
		ctx.lineTo(w[2], w[3]);
		ctx.stroke();
	}
	marker(x, y, label, goal, active) {
		const { ctx, theme: t } = this;
		const r = .26;
		if (goal) {
			ctx.fillStyle = t.accent;
			ctx.globalAlpha = .18;
			ctx.beginPath();
			ctx.arc(x, y, .35, 0, 2 * Math.PI);
			ctx.fill();
			ctx.globalAlpha = 1;
		}
		ctx.beginPath();
		ctx.arc(x, y, active ? r * 1.15 : r, 0, 2 * Math.PI);
		ctx.fillStyle = goal ? t.accent : t.surface;
		ctx.fill();
		if (!goal || active) {
			ctx.lineWidth = .05;
			ctx.strokeStyle = active ? t.fg : t.muted;
			ctx.stroke();
		}
		ctx.fillStyle = goal ? t.accentFg : t.muted;
		ctx.font = `600 0.28px ${t.sans}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, x, y + .01);
	}
	robot(x, y, th, r) {
		const { ctx, theme: t } = this;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(th + Math.PI / 2);
		const w = 2.6 * r;
		if (this.sprite) {
			const h = w * this.sprite.naturalHeight / this.sprite.naturalWidth || w * 180 / 260;
			ctx.drawImage(this.sprite, -w / 2, -h / 2, w, h);
		} else {
			ctx.fillStyle = t.fg;
			ctx.fillRect(-w / 2, -r * .8, r * .35, r * 1.6);
			ctx.fillRect(w / 2 - r * .35, -r * .8, r * .35, r * 1.6);
			ctx.fillStyle = t.accent;
			ctx.beginPath();
			ctx.arc(0, 0, r * .85, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillStyle = t.accentFg;
			ctx.beginPath();
			ctx.arc(0, -r * .5, r * .18, 0, 2 * Math.PI);
			ctx.fill();
		}
		ctx.restore();
	}
};
//#endregion
//#region web/src/demo/brain.ts
var FLOW_MIN = .35;
var MAX_DPR = 2;
var BrainView = class {
	canvas;
	ctx;
	net = null;
	names = [];
	layers = [];
	xs = [];
	ys = [];
	nodeR = 7;
	cssW = 1;
	cssH = 1;
	focus = null;
	compact = false;
	theme;
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		canvas.addEventListener("pointermove", (e) => e.pointerType === "mouse" && this.setFocus(this.hit(e)));
		canvas.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && this.setFocus(null));
		canvas.addEventListener("pointerdown", (e) => {
			if (e.pointerType === "mouse") return;
			const h = this.hit(e);
			this.setFocus(h && this.focus && h[0] === this.focus[0] && h[1] === this.focus[1] ? null : h);
		});
	}
	setNet(net, names) {
		this.net = net;
		this.names = names;
		this.focus = null;
		this.layers = [];
		this.layout();
	}
	update(layers) {
		this.layers = layers;
		this.draw();
	}
	layout() {
		if (!this.net) return;
		const arch = this.net.arch;
		const cssW = this.canvas.clientWidth || 1;
		const narrow = cssW < 460;
		const full = !this.compact;
		const maxN = Math.max(...arch);
		const step = full ? narrow ? 21 : 25 : 9.5;
		const pad = full ? 18 : 10;
		const cssH = Math.round((maxN - 1) * step + 2 * pad + (full ? 18 : 0));
		const padL = full ? narrow ? 86 : 104 : 12;
		const padR = full ? narrow ? 96 : 124 : 12;
		this.nodeR = full ? narrow ? 6 : 7.5 : 4.2;
		this.xs = arch.map((_, k) => padL + (cssW - padL - padR) * k / (arch.length - 1));
		const mid = (cssH - (full ? 18 : 0)) / 2;
		this.ys = arch.map((n) => Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step));
		this.cssW = cssW;
		this.cssH = cssH;
		this.canvas.style.height = `${cssH}px`;
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		this.canvas.width = Math.round(cssW * dpr);
		this.canvas.height = Math.round(cssH * dpr);
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.draw();
	}
	setFocus(f) {
		if (f === this.focus || f && this.focus && f[0] === this.focus[0] && f[1] === this.focus[1]) return;
		this.focus = f;
		this.draw();
	}
	hit(e) {
		const r = this.canvas.getBoundingClientRect();
		const x = e.clientX - r.left;
		const y = e.clientY - r.top;
		let best = null;
		let bd = (this.nodeR + 6) ** 2;
		this.ys.forEach((col, k) => col.forEach((ny, i) => {
			const d = (this.xs[k] - x) ** 2 + (ny - y) ** 2;
			if (d < bd) {
				bd = d;
				best = [k, i];
			}
		}));
		return best;
	}
	draw() {
		const { ctx, net, theme: t } = this;
		ctx.clearRect(0, 0, this.cssW, this.cssH);
		if (!net || !this.layers.length) return;
		const L = this.layers;
		const pos = rgb(t.accent);
		const neg = rgb(t.neg);
		const surf = rgb(t.surface);
		const fc = this.focus;
		const full = !this.compact;
		ctx.lineCap = "round";
		for (let k = 0; k < net.W.length; k++) {
			const nIn = net.arch[k];
			const nOut = net.arch[k + 1];
			const sig = (j, i) => net.weight(k, j, i) * L[k][i];
			let max = 1e-12;
			for (let j = 0; j < nOut; j++) for (let i = 0; i < nIn; i++) max = Math.max(max, Math.abs(sig(j, i)));
			for (let j = 0; j < nOut; j++) {
				if (fc) {
					for (let i = 0; i < nIn; i++) if (fc[0] === k && fc[1] === i || fc[0] === k + 1 && fc[1] === j) this.edge(k, i, j, sig(j, i), max, pos, neg, surf);
					continue;
				}
				let bi = 0;
				for (let i = 1; i < nIn; i++) if (Math.abs(sig(j, i)) > Math.abs(sig(j, bi))) bi = i;
				if (Math.abs(sig(j, bi)) >= FLOW_MIN * max) this.edge(k, bi, j, sig(j, bi), max, pos, neg, surf);
			}
		}
		const last = L.length - 1;
		L.forEach((layer, k) => layer.forEach((v0, i) => {
			const v = k === last ? Math.max(-1, Math.min(1, v0)) : v0;
			const on = fc && fc[0] === k && fc[1] === i;
			const dim = fc && !on && !this.linked(k, i);
			ctx.globalAlpha = dim ? .35 : 1;
			ctx.beginPath();
			ctx.arc(this.xs[k], this.ys[k][i], on ? this.nodeR * 1.35 : this.nodeR, 0, 2 * Math.PI);
			ctx.fillStyle = mix(surf, v >= 0 ? pos : neg, .12 + .88 * Math.min(1, Math.abs(v)));
			ctx.fill();
			ctx.lineWidth = on ? 2 : 1;
			ctx.strokeStyle = on ? t.fg : t.border;
			ctx.stroke();
			ctx.globalAlpha = 1;
			if (on && full && k > 0 && k < last) this.text(v.toFixed(2), this.xs[k], this.ys[k][i] - this.nodeR - 9, "center", t.fg, true);
		}));
		if (!full) return;
		const narrow = this.cssW < 460;
		const f = (v) => (v >= 0 ? " " : "") + v.toFixed(2);
		L[0].forEach((v, i) => {
			this.text(this.names[i] ?? "", this.xs[0] - 13, this.ys[0][i], "right", t.fg);
			this.text(f(v), this.xs[0] - (narrow ? 58 : 70), this.ys[0][i], "right", t.muted, true);
		});
		["left wheel", "right wheel"].forEach((name, i) => {
			const v = Math.max(-1, Math.min(1, L[last][i]));
			this.text(narrow ? name.replace(" wheel", "") : name, this.xs[last] + 13, this.ys[last][i], "left", t.fg);
			this.text(f(v), this.xs[last] + (narrow ? 50 : 84), this.ys[last][i], "left", t.fg, true, true);
		});
		[
			"inputs",
			...net.arch.slice(1, -1).map(String),
			"wheels"
		].forEach((c, k) => this.text(c, this.xs[k], this.cssH - 6, "center", t.muted, true));
	}
	linked(k, i) {
		const fc = this.focus;
		return Math.abs(fc[0] - k) === 1;
	}
	edge(k, i, j, s, max, pos, neg, surf) {
		const { ctx } = this;
		const m = Math.min(1, Math.abs(s) / max);
		ctx.strokeStyle = mix(surf, s >= 0 ? pos : neg, .25 + .75 * m);
		ctx.lineWidth = (this.compact ? .5 : .7) + (this.compact ? 1.4 : 2.6) * m;
		ctx.beginPath();
		ctx.moveTo(this.xs[k], this.ys[k][i]);
		ctx.lineTo(this.xs[k + 1], this.ys[k + 1][j]);
		ctx.stroke();
	}
	text(s, x, y, align, color, mono = false, bold = false) {
		const { ctx } = this;
		const narrow = this.cssW < 460;
		ctx.font = `${bold ? 600 : 400} ${mono ? narrow ? 9.5 : 10.5 : narrow ? 10.5 : 12}px ${mono ? this.theme.mono : this.theme.sans}`;
		ctx.textAlign = align;
		ctx.textBaseline = "middle";
		ctx.fillStyle = color;
		ctx.fillText(s, x, y);
	}
};
//#endregion
//#region web/src/demo/rule.ts
var RULES = [
	["seek", "Steer towards B"],
	["keep-wall-right", "Wall close on the right: don’t turn into it"],
	["keep-wall-left", "Wall close on the left: don’t turn into it"],
	["avoid", "Wall ahead: slow down, turn to the open side"]
];
var RuleView = class {
	el;
	bars = {};
	rules = /* @__PURE__ */ new Map();
	goal;
	goalText;
	constructor() {
		const el = document.createElement("div");
		el.className = "wm-rule";
		const bar = (key, label, signed = false) => `<div class="wm-gauge${signed ? " wm-signed" : ""}" data-k="${key}"><span>${label}</span><i><b></b></i><em></em></div>`;
		el.innerHTML = `
			<div class="wm-rule-col">
				<p class="wm-sub">Sees</p>
				${bar("left", "left")}${bar("front", "ahead")}${bar("right", "right")}
				<div class="wm-goal"><svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10"/><path d="M0 -8 L3 -2 L-3 -2 Z"/></svg><span></span></div>
			</div>
			<div class="wm-rule-col wm-rules">
				<p class="wm-sub">Rule in charge</p>
				<ol>${RULES.map(([k, s]) => `<li data-r="${k}">${s}</li>`).join("")}</ol>
			</div>
			<div class="wm-rule-col">
				<p class="wm-sub">Wheels</p>
				${bar("ul", "left", true)}${bar("ur", "right", true)}
			</div>`;
		el.querySelectorAll(".wm-gauge").forEach((g) => this.bars[g.dataset.k] = [g.querySelector("b"), g.querySelector("em")]);
		el.querySelectorAll("li").forEach((li) => this.rules.set(li.dataset.r, li));
		this.goal = el.querySelector(".wm-goal path");
		this.goalText = el.querySelector(".wm-goal span");
		this.el = el;
	}
	update(t, action) {
		const dist = (k, v) => {
			const [b, em] = this.bars[k];
			b.style.width = `${Math.min(v, 3) / 3 * 100}%`;
			em.textContent = v >= 3 ? "clear" : v.toFixed(1);
		};
		dist("left", t.left);
		dist("front", t.front);
		dist("right", t.right);
		const wheel = (k, v) => {
			const [b, em] = this.bars[k];
			b.style.width = `${Math.abs(v) * 50}%`;
			b.style.marginLeft = v >= 0 ? "50%" : `${50 - Math.abs(v) * 50}%`;
			em.textContent = (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);
		};
		wheel("ul", action[0]);
		wheel("ur", action[1]);
		const deg = t.bearing * 180 / Math.PI;
		this.goal.setAttribute("transform", `rotate(${deg.toFixed(1)})`);
		const a = Math.abs(deg);
		this.goalText.textContent = a < 5 ? "B straight ahead" : `B ${a.toFixed(0)}° ${deg > 0 ? "right" : "left"}`;
		for (const [k, li] of this.rules) li.classList.toggle("wm-on", k === t.rule);
	}
};
//#endregion
//#region web/src/demo/styles.ts
var CSS = `
.wm{--wm-fg:var(--fg,#1d1c1a);--wm-bg:var(--bg,#fbfaf7);--wm-surface:var(--surface,#fff);--wm-border:var(--border,#e7e3db);
--wm-muted:var(--muted,#67635c);--wm-accent:var(--accent,#c94436);--wm-accent-fg:var(--accent-fg,#fff);--wm-neg:var(--ai,#2862cf);
container-type:inline-size;display:grid;gap:12px;color:var(--wm-fg);font:inherit}
.wm *{box-sizing:border-box}
.wm [hidden]{display:none!important}
.wm button,.wm select{font:inherit;color:inherit}
.wm button{cursor:pointer}
.wm :focus-visible{outline:2px solid var(--wm-accent);outline-offset:2px}
.wm-versions{display:grid;gap:6px}
.wm-chips{display:flex;flex-wrap:wrap;gap:8px}
.wm-chip{padding:6px 14px;border:1px solid var(--wm-border);border-radius:999px;background:var(--wm-surface);font-size:14px;font-weight:500}
.wm-chip[aria-checked=true]{border-color:var(--wm-fg);background:var(--wm-fg);color:var(--wm-bg)}
.wm-blurb{margin:0;font-size:14px;color:var(--wm-muted)}
.wm-stage{position:relative;overflow:hidden;border:1px solid var(--wm-border);border-radius:var(--radius,12px);background:var(--wm-surface)}
.wm-arena{display:block;width:100%;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.wm-stage[data-tool=draw] .wm-arena,.wm-stage[data-tool=erase] .wm-arena{touch-action:none;cursor:crosshair}
.wm-stage[data-tool=erase] .wm-arena{cursor:cell}
.wm-arena.wm-grab{cursor:grab}
.wm-status{position:absolute;top:10px;left:10px;padding:2px 10px;border:1px solid var(--wm-border);border-radius:999px;
background:color-mix(in srgb,var(--wm-surface) 88%,transparent);font:500 12px var(--font-mono,ui-monospace,monospace);color:var(--wm-muted);pointer-events:none}
.wm-warn{position:absolute;top:10px;right:10px;left:auto;padding:4px 12px;border-radius:999px;
background:var(--wm-accent);color:var(--wm-accent-fg);font-size:13px;font-weight:600;pointer-events:none}
.wm-result{position:absolute;left:10px;right:10px;bottom:14px;width:fit-content;margin-inline:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;
padding:8px 10px 8px 16px;border:1px solid var(--wm-border);border-radius:999px;background:var(--wm-surface);box-shadow:var(--shadow,0 10px 30px rgb(0 0 0/.1));
font-weight:600;white-space:nowrap}
.wm-result button{padding:5px 12px;border:1px solid var(--wm-border);border-radius:999px;background:var(--wm-bg);font-size:13px;font-weight:500}
.wm-result button.wm-primary{border-color:var(--wm-fg);background:var(--wm-fg);color:var(--wm-bg)}
.wm-hint{position:absolute;left:10px;right:10px;bottom:14px;width:fit-content;margin-inline:auto;display:flex;align-items:center;gap:10px;
padding:6px 6px 6px 16px;border:1px solid var(--wm-accent);border-radius:999px;background:var(--wm-surface);box-shadow:var(--shadow,0 10px 30px rgb(0 0 0/.1));
font-size:14px;font-weight:600;animation:wm-pop .35s ease-out}
.wm-hint button{flex:none;padding:5px 12px;border:1px solid var(--wm-border);border-radius:999px;background:var(--wm-bg);font-size:13px;font-weight:600}
.wm-hint .wm-primary{border-color:var(--wm-accent);background:var(--wm-accent);color:var(--wm-accent-fg)}
.wm-hint .wm-x{padding:5px 9px;border:0;background:none;color:var(--wm-muted)}
@keyframes wm-pop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.wm-hint{animation:none}}
.wm-note{margin:0;font-size:13px;color:var(--wm-muted)}
.wm-layouts{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.wm-lay{display:grid;gap:4px;justify-items:center;padding:6px 6px 5px;border:1px solid var(--wm-border);border-radius:10px;background:var(--wm-surface);font-size:12.5px;font-weight:500;color:var(--wm-muted)}
.wm-lay svg{width:100%;max-width:96px;height:auto}
.wm-lay .wm-port,.wm[data-portrait=true] .wm-lay .wm-land{display:none}
.wm[data-portrait=true] .wm-lay .wm-port{display:block;max-width:44px}
.wm-lay rect{fill:var(--wm-bg);stroke:var(--wm-border);stroke-width:.15}
.wm-lay line{stroke:currentColor;stroke-linecap:round}
.wm-lay .wm-a{fill:none;stroke:currentColor;stroke-width:.2}
.wm-lay .wm-b{fill:var(--wm-accent)}
.wm-lay:hover{border-color:var(--wm-muted)}
.wm-lay[aria-checked=true]{border-color:var(--wm-fg);color:var(--wm-fg);box-shadow:inset 0 0 0 1px var(--wm-fg)}
.wm-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
.wm-group{display:flex;align-items:center;gap:6px}
.wm select{padding:6px 10px;border:1px solid var(--wm-border);border-radius:8px;background:var(--wm-surface);font-size:14px;font-weight:500}
.wm-seg{display:inline-flex;padding:2px;border:1px solid var(--wm-border);border-radius:9px;background:var(--wm-surface)}
.wm-seg button{padding:5px 11px;border:0;border-radius:7px;background:none;color:var(--wm-muted);font-size:13px;font-weight:500}
.wm-seg button[aria-checked=true]{background:var(--wm-bg);color:var(--wm-fg);box-shadow:inset 0 0 0 1px var(--wm-border)}
.wm-icon{display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid var(--wm-border);border-radius:50%;background:var(--wm-surface)}
.wm-icon.wm-main{width:40px;height:40px;border-color:var(--wm-fg);background:var(--wm-fg);color:var(--wm-bg)}
.wm-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.wm-panel{padding:14px 18px;border:1px solid var(--wm-border);border-radius:var(--radius,12px);background:var(--wm-surface)}
.wm-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}
.wm-title{margin:0;font:500 12px var(--font-mono,ui-monospace,monospace);text-transform:uppercase;letter-spacing:.06em;color:var(--wm-muted)}
.wm-legend{display:flex;gap:14px;font-size:12px;color:var(--wm-muted)}
.wm-legend i{display:inline-block;width:9px;height:9px;margin-right:5px;border-radius:50%}
.wm-brain{display:block;width:100%;max-width:760px;margin-inline:auto}
.wm-foot{display:none;gap:14px;align-items:center;font-size:13px;color:var(--wm-muted)}
.wm-foot b{font-family:var(--font-mono,ui-monospace,monospace);color:var(--wm-fg)}
.wm-foot button{margin-left:auto;padding:0;border:0;background:none;color:var(--wm-muted);font-size:13px;text-decoration:underline;text-underline-offset:3px}
.wm-rule{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:20px;padding:4px 0}
.wm-sub{margin:0 0 6px;font-size:12px;color:var(--wm-muted)}
.wm-gauge{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:8px;margin:5px 0;font-size:13px}
.wm-gauge i{position:relative;height:8px;border-radius:4px;background:var(--wm-bg);box-shadow:inset 0 0 0 1px var(--wm-border);overflow:hidden}
.wm-gauge b{display:block;height:100%;border-radius:4px;background:var(--wm-muted)}
.wm-gauge.wm-signed b{background:var(--wm-accent)}
.wm-gauge em{font:normal 12px var(--font-mono,ui-monospace,monospace);text-align:right;color:var(--wm-muted)}
.wm-goal{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px}
.wm-goal svg{width:24px;height:24px}
.wm-goal circle{fill:none;stroke:var(--wm-border);stroke-width:1.5}
.wm-goal path{fill:var(--wm-accent)}
.wm-rules ol{margin:0;padding-left:20px;font-size:13px;color:var(--wm-muted)}
.wm-rules li{padding:3px 6px;border-radius:6px}
.wm-rules li.wm-on{background:color-mix(in srgb,var(--wm-accent) 14%,transparent);color:var(--wm-fg);font-weight:600}
.wm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@container (max-width: 600px){
.wm-toolbar{justify-content:flex-start}
.wm-play{width:100%;justify-content:space-between}
.wm-panel{padding:10px 12px}
.wm-legend{display:none}
.wm-foot{display:flex}
.wm-rule{grid-template-columns:1fr;gap:10px}
.wm-result{bottom:10px;padding:8px 12px;border-radius:16px;font-size:14px;white-space:normal}
.wm-result-text{flex-basis:100%;text-align:center}
.wm-warn{top:40px;left:10px;right:auto}
.wm-hint{bottom:10px;padding:6px 6px 6px 12px;font-size:13px}
.wm-layouts{grid-template-columns:repeat(3,1fr);gap:6px}
}
`;
function injectStyles(doc = document) {
	if (doc.getElementById("wm-styles")) return;
	const s = doc.createElement("style");
	s.id = "wm-styles";
	s.textContent = CSS;
	doc.head.appendChild(s);
}
//#endregion
//#region web/src/demo/versions.ts
var VERSIONS = [
	{
		id: "heuristic",
		name: "By-the-Book",
		blurb: "A heuristic policy with no learning. The baseline the trained versions are compared with."
	},
	{
		id: "v3-rookie",
		name: "Rookie",
		blurb: "The first version that learned to drive. Good in open layouts, weak in mazes.",
		load: () => import("./maze-bot-weights-CPuvYqCO.js")
	},
	{
		id: "v4-owl-eyes",
		name: "Owl Eyes",
		blurb: "Seven rays all around, including behind. Better at getting out of traps.",
		load: () => import("./maze-bot-weights-Bkx4MjQ_.js")
	},
	{
		id: "final",
		name: "Wheely",
		blurb: "Gets its previous wheel command as input. Matches or beats the heuristic in 6 of 7 categories.",
		load: () => import("./maze-bot-weights-Bd0wvSmz.js")
	}
];
var DEFAULT_VERSION = "final";
async function loadWeights(v) {
	if (!v.load) return null;
	return (await v.load()).default;
}
//#endregion
//#region web/src/demo/mount.ts
var BRUSH = .1;
var ERASER = .25;
var RDP_EPS = .03;
var MAX_WALLS = 400;
var PORTRAIT_BELOW = 480;
var NARROW_BELOW = 600;
var SPEEDS = [
	.5,
	1,
	4
];
var MAX_TRACE = 4e3;
var HINT_AFTER = 4;
var ICON = {
	reset: "<path d=\"M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4\"/>",
	play: "<path d=\"M7 5l12 7-12 7z\"/>",
	pause: "<path d=\"M8 5v14M16 5v14\"/>",
	step: "<path d=\"M6 5l9 7-9 7zM18 5v14\"/>"
};
var svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
/** Mini map of a preset for its layout chip (walls, A and B). */
function thumb(p) {
	const svg = (m, cls) => {
		const walls = m.walls.map((w) => `<line x1="${w[0]}" y1="${w[1]}" x2="${w[2]}" y2="${w[3]}" stroke-width="${Math.max(.3, 2 * w[4])}"/>`).join("");
		return `<svg class="${cls}" viewBox="-0.2 -0.2 ${m.width + .4} ${m.height + .4}" aria-hidden="true"><rect x="0" y="0" width="${m.width}" height="${m.height}" rx="0.3"/>${walls}<circle class="wm-a" cx="${m.start[0]}" cy="${m.start[1]}" r="0.45"/><circle class="wm-b" cx="${m.goal[0]}" cy="${m.goal[1]}" r="0.45"/></svg>`;
	};
	return svg(presetMap(p), "wm-land") + svg(presetMap(p, true), "wm-port");
}
function transpose(m) {
	return {
		name: m.name,
		width: m.height,
		height: m.width,
		walls: m.walls.map((w) => [
			w[1],
			w[0],
			w[3],
			w[2],
			w[4]
		]),
		start: [
			m.start[1],
			m.start[0],
			Math.PI / 2 - m.start[2]
		],
		goal: [m.goal[1], m.goal[0]]
	};
}
function mountMazeDemo(el, opts = {}) {
	injectStyles();
	const showNetwork = opts.showNetwork ?? true;
	const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const root = document.createElement("div");
	root.className = "wm";
	const startLayout = opts.mode === "draw" ? "Open field" : "Rooms";
	root.innerHTML = `
		<div class="wm-versions">
			<div class="wm-chips" role="radiogroup" aria-label="Which Wheely">
				${VERSIONS.filter((v) => !v.hidden).map((v) => `<button type="button" class="wm-chip" role="radio" aria-checked="false" data-v="${v.id}">${v.name}</button>`).join("")}
			</div>
			<p class="wm-blurb"></p>
		</div>
		<div class="wm-stage">
			<canvas class="wm-arena" tabindex="0" role="img" aria-label="Arena: Wheely drives from A to B. Drag A or B; draw or erase walls with the tools below."></canvas>
			<span class="wm-status"></span>
			<span class="wm-warn" hidden>No path to B — Wheely will get lost</span>
			<div class="wm-result" hidden><span class="wm-result-text"></span>
				<button type="button" class="wm-primary" data-act="again">Again</button><button type="button" data-act="shuffle">New A/B</button></div>
			<div class="wm-hint" hidden role="status"><span class="wm-hint-text">Try drawing a wall in Wheely’s way</span>
				<button type="button" class="wm-primary" data-act="hint-draw">✏️ Draw</button><button type="button" class="wm-x" data-act="hint-close" aria-label="Dismiss tip">✕</button></div>
		</div>
		<p class="wm-note" hidden></p>
		<div class="wm-layouts" role="radiogroup" aria-label="Layout">
			${PRESETS.map((p) => `<button type="button" class="wm-lay" role="radio" aria-checked="${p.name === startLayout}" data-layout="${p.name}">${thumb(p)}<span>${p.name}</span></button>`).join("")}
		</div>
		<div class="wm-toolbar">
			<div class="wm-group">
				<div class="wm-seg wm-tools" role="radiogroup" aria-label="Tool">
					<button type="button" role="radio" data-tool="move" title="Drag A and B">Move</button>
					<button type="button" role="radio" data-tool="draw" title="Draw walls">Draw</button>
					<button type="button" role="radio" data-tool="erase" title="Erase walls">Erase</button>
				</div>
				<div class="wm-seg"><button type="button" data-act="clear" title="Remove all walls">Clear</button></div>
			</div>
			<div class="wm-group wm-play">
				<button type="button" class="wm-icon" data-act="reset" aria-label="Restart from A" title="Restart from A">${svg(ICON.reset)}</button>
				<button type="button" class="wm-icon wm-main" data-act="play" aria-label="Pause">${svg(ICON.pause)}</button>
				<button type="button" class="wm-icon" data-act="step" aria-label="Step once" title="Step once">${svg(ICON.step)}</button>
				<div class="wm-seg wm-speed" role="radiogroup" aria-label="Speed">
					${SPEEDS.map((s) => `<button type="button" role="radio" data-speed="${s}">${s === .5 ? "½" : s}×</button>`).join("")}
				</div>
			</div>
		</div>
		<div class="wm-panel"${showNetwork ? "" : " hidden"}>
			<div class="wm-panel-head"><p class="wm-title"></p>
				<div class="wm-legend"><span><i style="background:var(--wm-accent)"></i>pushes up</span><span><i style="background:var(--wm-neg)"></i>pushes down</span></div></div>
			<canvas class="wm-brain" aria-label="Wheely's neural network, live. Hover or tap a neuron to see its connections."></canvas>
			<div class="wm-panel-rule"></div>
			<div class="wm-foot"><span>left <b class="wm-ul">0.00</b></span><span>right <b class="wm-ur">0.00</b></span><button type="button" data-act="enlarge">tap to enlarge</button></div>
		</div>
		<p class="wm-sr" aria-live="polite"></p>`;
	el.appendChild(root);
	const $ = (s) => root.querySelector(s);
	const stage = $(".wm-stage");
	const statusEl = $(".wm-status");
	const warnEl = $(".wm-warn");
	const resultEl = $(".wm-result");
	const resultText = $(".wm-result-text");
	const hintEl = $(".wm-hint");
	const noteEl = $(".wm-note");
	const playBtn = $("[data-act=play]");
	const panel = $(".wm-panel");
	const ruleBox = $(".wm-panel-rule");
	const brainCanvas = $(".wm-brain");
	const live = $("[aria-live]");
	const arena = new ArenaView($(".wm-arena"), opts.sprite);
	const brain = new BrainView(brainCanvas);
	const rule = new RuleView();
	ruleBox.appendChild(rule.el);
	let theme = readTheme(root);
	arena.theme = brain.theme = theme;
	let versionId = VERSIONS.some((v) => v.id === opts.version) ? opts.version : DEFAULT_VERSION;
	let net = null;
	let heuristic = null;
	let p = simParams();
	let portrait = root.clientWidth > 0 && root.clientWidth < PORTRAIT_BELOW;
	let layout = startLayout;
	let map = presetMap(PRESETS.find((x) => x.name === layout), portrait);
	let ep = new Episode(map, p);
	let running = !reduced;
	let started = !reduced;
	let speed = 1;
	let tool = opts.mode === "draw" ? "draw" : "move";
	let ready = false;
	let trace = [];
	let prev = { ...ep.pose };
	let acc = 0;
	let lastAction = [0, 0];
	let visible = true;
	let pageVisible = !document.hidden;
	let raf = 0;
	let lastT = 0;
	let dirty = true;
	let expanded = false;
	let loadToken = 0;
	let drag = null;
	let hoverHandle = null;
	let stroke = null;
	let strokeBase = [];
	let erasing = false;
	let eraser;
	let pointerId = -1;
	let hint = "waiting";
	let driven = 0;
	const policyDt = () => p.dt * p.frameSkip;
	const simTime = () => (ep.steps * policyDt()).toFixed(1);
	function restart() {
		ep.reset();
		prev = { ...ep.pose };
		trace = [ep.pose.x, ep.pose.y];
		acc = 0;
		lastAction = [0, 0];
		resultEl.hidden = true;
		sense();
		hintEl.hidden = hint !== "shown" && hint !== "drawing";
		syncWarn();
		syncStatus();
		dirty = true;
		kick();
	}
	function setMap(m) {
		map = m;
		arena.setWorld(m.width, m.height);
		ep.setMap(m);
		restart();
	}
	function sense() {
		const obs = ep.observation();
		if (net) brain.update(net.forward(obs).layers);
		else if (heuristic) {
			const r = heuristic.act(obs);
			rule.update(r.trace, r.action);
		}
	}
	function syncWarn() {
		warnEl.hidden = ep.reachable;
	}
	function syncStatus() {
		const t = `${simTime()} s`;
		statusEl.textContent = !ready ? "Loading…" : ep.done === "success" ? `Reached B · ${t}` : ep.done === "lost" ? `Lost · ${t}` : !started ? "Press play" : running ? `Driving · ${t}` : `Paused · ${t}`;
		playBtn.setAttribute("aria-label", running ? "Pause" : "Play");
		playBtn.title = running ? "Pause" : "Play";
		playBtn.innerHTML = svg(running ? ICON.pause : ICON.play);
	}
	function announce(s) {
		live.textContent = s;
	}
	function stepOnce() {
		if (ep.done) return;
		prev = { ...ep.pose };
		const obs = ep.observation();
		let action;
		if (net) action = net.forward(obs).action;
		else action = heuristic.act(obs).action;
		lastAction = action;
		const res = ep.step(action);
		driven += policyDt();
		if (hint === "waiting" && driven >= HINT_AFTER) setHint("shown");
		trace.push(ep.pose.x, ep.pose.y);
		if (trace.length > 2 * MAX_TRACE) trace = trace.slice(-2 * MAX_TRACE);
		sense();
		$(".wm-ul").textContent = lastAction[0].toFixed(2);
		$(".wm-ur").textContent = lastAction[1].toFixed(2);
		if (res.success || res.lost) {
			acc = 0;
			prev = { ...ep.pose };
			resultText.textContent = res.success ? `Reached B in ${simTime()} s` : `Lost after ${simTime()} s`;
			resultEl.hidden = false;
			hintEl.hidden = true;
			announce(res.success ? `Wheely reached B in ${simTime()} seconds.` : "Wheely got lost.");
		}
		dirty = true;
	}
	async function setVersion(id) {
		versionId = id;
		const v = VERSIONS.find((x) => x.id === id);
		root.querySelectorAll(".wm-chip").forEach((c) => c.setAttribute("aria-checked", String(c.dataset.v === id)));
		$(".wm-blurb").textContent = v.blurb;
		const token = ++loadToken;
		const w = await loadWeights(v);
		if (token !== loadToken) return;
		if (w) {
			net = new MLPPolicy(w);
			heuristic = null;
			p = net.sim;
		} else {
			heuristic = new HeuristicPolicy();
			net = null;
			p = heuristic.sim;
		}
		ep = new Episode(map, p);
		ready = true;
		const owner = v.name.endsWith("s") ? `${v.name}'` : `${v.name}'s`;
		$(".wm-title").textContent = `${owner} ${net ? "brain" : "rule"} · live`;
		$(".wm-legend").hidden = !net;
		brainCanvas.hidden = !net;
		ruleBox.hidden = !!net;
		root.querySelector(".wm-foot").style.visibility = net ? "" : "hidden";
		if (net) brain.setNet(net, obsNames(p));
		restart();
	}
	function kick() {
		if (!raf && visible && pageVisible) raf = requestAnimationFrame(frame);
	}
	function frame(t) {
		raf = 0;
		const dt = lastT ? Math.min(.1, (t - lastT) / 1e3) : 0;
		lastT = t;
		const stepping = ready && running && !ep.done && !drag && !stroke;
		if (stepping) {
			acc += dt * speed;
			let n = 0;
			while (acc >= policyDt() && n < 8 && !ep.done) {
				stepOnce();
				acc -= policyDt();
				n++;
			}
			if (n) syncStatus();
		}
		if (stepping || dirty) {
			const a = stepping && !ep.done ? Math.min(1, acc / policyDt()) : 1;
			const pose = {
				x: prev.x + (ep.pose.x - prev.x) * a,
				y: prev.y + (ep.pose.y - prev.y) * a,
				th: prev.th + wrapAngle(ep.pose.th - prev.th) * a
			};
			arena.draw({
				map: ep.map,
				pose,
				rays: ep.rays,
				rayAngles: p.rayAngles,
				rayRange: p.rayRange,
				radius: p.radius,
				trace: a < 1 ? [
					...trace.slice(0, -2),
					pose.x,
					pose.y
				] : trace,
				stroke: stroke ?? void 0,
				brush: BRUSH,
				eraser,
				grab: drag ?? hoverHandle
			});
			dirty = false;
		}
		if (stepping) kick();
		else lastT = 0;
	}
	function setHint(h) {
		hint = h;
		hintEl.hidden = !(h === "shown" || h === "drawing") || !resultEl.hidden;
		if (h === "drawing") {
			$(".wm-hint-text").textContent = "Drag across the arena to draw a wall";
			$("[data-act=hint-draw]").hidden = true;
		}
	}
	function setTool(t, byUser = false) {
		if (byUser) {
			if (hint === "waiting") setHint("done");
			else if (hint === "shown") setHint(t === "draw" ? "drawing" : "done");
			else if (hint === "drawing" && t !== "draw") setHint("done");
		}
		tool = t;
		stage.dataset.tool = t;
		root.querySelectorAll("button[data-tool]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.tool === t)));
		eraser = void 0;
		dirty = true;
		kick();
	}
	function setSpeed(s) {
		speed = s;
		root.querySelectorAll("[data-speed]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.speed) === s)));
	}
	function togglePlay(force) {
		running = force ?? !running;
		started = started || running;
		if (running && ep.done) restart();
		syncStatus();
		kick();
	}
	function shuffle() {
		const g = ep.grid;
		const free = [];
		for (let k = 0; k < g.free.length; k++) if (g.free[k] && g.clear[k] >= p.radius + .15) free.push(k);
		if (free.length < 2) return;
		const pick = () => {
			const k = free[Math.floor(Math.random() * free.length)];
			return [(k % g.nx + .5) * g.cell, (Math.floor(k / g.nx) + .5) * g.cell];
		};
		const minD = .4 * Math.max(map.width, map.height);
		for (let tries = 0; tries < 60; tries++) {
			const [bx, by] = pick();
			const [ax, ay] = pick();
			if (Math.hypot(bx - ax, by - ay) < minD) continue;
			const m = {
				...map,
				start: [
					ax,
					ay,
					Math.atan2(by - ay, bx - ax)
				],
				goal: [bx, by]
			};
			if (!new Episode(m, p).reachable && tries < 59) continue;
			setMap(m);
			return;
		}
	}
	function setWalls(walls, replan) {
		map = {
			...map,
			walls
		};
		ep.updateWalls(walls, replan);
		if (replan) {
			const ok = started && !ep.done && ep.steps > 0 ? ep.reachableFrom(ep.pose.x, ep.pose.y) : ep.reachableFrom(map.start[0], map.start[1]);
			warnEl.hidden = ok;
			if (!ok) announce("No path to B. Wheely will get lost.");
		}
		dirty = true;
		kick();
	}
	root.addEventListener("click", (e) => {
		const b = e.target.closest("button");
		if (!b || !root.contains(b)) return;
		if (b.dataset.v) setVersion(b.dataset.v);
		else if (b.dataset.tool) setTool(b.dataset.tool, true);
		else if (b.dataset.speed) setSpeed(Number(b.dataset.speed));
		else if (b.dataset.layout) setLayout(b.dataset.layout);
		else switch (b.dataset.act) {
			case "play":
				togglePlay();
				break;
			case "reset":
				restart();
				break;
			case "step":
				if (running) togglePlay(false);
				if (ep.done) restart();
				else if (ready) {
					started = true;
					stepOnce();
					prev = { ...ep.pose };
					syncStatus();
					kick();
				}
				break;
			case "again":
				restart();
				togglePlay(true);
				break;
			case "shuffle":
				shuffle();
				togglePlay(true);
				break;
			case "clear":
				setWalls([], true);
				break;
			case "hint-draw":
				setTool("draw", true);
				break;
			case "hint-close":
				setHint("done");
				break;
			case "enlarge":
				expanded = !expanded;
				syncPanel();
		}
	});
	function setLayout(name) {
		layout = name;
		root.querySelectorAll("[data-layout]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.layout === name)));
		setMap(presetMap(PRESETS.find((x) => x.name === name), portrait));
	}
	root.addEventListener("keydown", (e) => {
		if (e.key === " " && e.target === arena.canvas) {
			e.preventDefault();
			togglePlay();
		}
	});
	const canvas = arena.canvas;
	const handleAt = (x, y) => {
		const r = Math.max(.45, 22 / arena.scale);
		const dA = Math.hypot(x - map.start[0], y - map.start[1]);
		const dB = Math.hypot(x - map.goal[0], y - map.goal[1]);
		if (dB <= r && dB <= dA) return "B";
		return dA <= r ? "A" : null;
	};
	const clampIn = (x, y) => {
		const m = p.radius + .06;
		return [Math.min(map.width - m, Math.max(m, x)), Math.min(map.height - m, Math.max(m, y))];
	};
	const onTouchStart = (e) => {
		const t = e.touches[0];
		if (tool === "move" && t && handleAt(...arena.toWorld(t.clientX, t.clientY))) e.preventDefault();
	};
	canvas.addEventListener("touchstart", onTouchStart, { passive: false });
	function eraseAt(x, y) {
		const tmp = /* @__PURE__ */ new Float64Array(3);
		const kept = map.walls.filter((w) => {
			closestPoint(x, y, Float64Array.from(w), 0, tmp);
			return tmp[2] > ERASER + w[4];
		});
		if (kept.length !== map.walls.length) setWalls(kept, false);
	}
	canvas.addEventListener("pointerdown", (e) => {
		if (!ready || e.pointerType === "mouse" && e.button !== 0) return;
		const [x, y] = arena.toWorld(e.clientX, e.clientY);
		const h = handleAt(x, y);
		if (h) drag = h;
		else if (tool === "draw") {
			if (map.walls.length >= MAX_WALLS) {
				noteEl.textContent = "Wall limit reached: erase or clear some walls to draw more.";
				noteEl.hidden = false;
				return;
			}
			stroke = [[x, y]];
			strokeBase = map.walls;
		} else if (tool === "erase") {
			erasing = true;
			eraser = {
				x,
				y,
				r: ERASER
			};
			eraseAt(x, y);
		} else return;
		pointerId = e.pointerId;
		canvas.setPointerCapture(e.pointerId);
		e.preventDefault();
		dirty = true;
		kick();
	});
	canvas.addEventListener("pointermove", (e) => {
		const [x, y] = arena.toWorld(e.clientX, e.clientY);
		if (e.pointerId !== pointerId) {
			if (e.pointerType !== "mouse") return;
			const h = handleAt(x, y);
			canvas.classList.toggle("wm-grab", !!h);
			if (tool === "erase") eraser = {
				x,
				y,
				r: ERASER
			};
			if (h !== hoverHandle || tool === "erase") {
				hoverHandle = h;
				dirty = true;
				kick();
			}
			return;
		}
		if (drag) {
			const [cx, cy] = clampIn(x, y);
			map = drag === "A" ? {
				...map,
				start: [
					cx,
					cy,
					map.start[2]
				]
			} : {
				...map,
				goal: [cx, cy]
			};
			ep.map = map;
			if (drag === "A") {
				ep.pose = {
					x: cx,
					y: cy,
					th: map.start[2]
				};
				prev = { ...ep.pose };
				trace = [cx, cy];
			}
		} else if (stroke) {
			const last = stroke[stroke.length - 1];
			if (Math.hypot(x - last[0], y - last[1]) < .06) return;
			stroke.push([x, y]);
			const seg = polylineCapsules(stroke.slice(-2), BRUSH);
			setWalls([...map.walls, Array.from(seg)], false);
		} else if (erasing) {
			eraser = {
				x,
				y,
				r: ERASER
			};
			eraseAt(x, y);
		}
		dirty = true;
		kick();
	});
	const endPointer = (e) => {
		if (e.pointerId !== pointerId) return;
		pointerId = -1;
		if (drag) {
			const d = drag;
			drag = null;
			if (d === "A") {
				const [ax, ay] = map.start;
				map = {
					...map,
					start: [
						ax,
						ay,
						Math.atan2(map.goal[1] - ay, map.goal[0] - ax)
					]
				};
			}
			setMap(map);
			if (started) togglePlay(true);
		} else if (stroke) {
			const pts = rdp(stroke, RDP_EPS);
			stroke = null;
			if (hint !== "done") setHint("done");
			const caps = polylineCapsules(pts, BRUSH);
			const rows = [...strokeBase];
			for (let k = 0; k < caps.length; k += 5) rows.push(Array.from(caps.subarray(k, k + 5)));
			if (rows.length > MAX_WALLS) {
				noteEl.textContent = "Wall limit reached: erase or clear some walls to draw more.";
				noteEl.hidden = false;
				setWalls(strokeBase, true);
			} else {
				noteEl.hidden = true;
				setWalls(rows, true);
			}
		} else if (erasing) {
			erasing = false;
			if (e.pointerType !== "mouse") eraser = void 0;
			noteEl.hidden = true;
			setWalls(map.walls, true);
		}
		dirty = true;
		kick();
	};
	canvas.addEventListener("pointerup", endPointer);
	canvas.addEventListener("pointercancel", endPointer);
	canvas.addEventListener("pointerleave", () => {
		if (pointerId !== -1) return;
		hoverHandle = null;
		if (tool === "erase") eraser = void 0;
		dirty = true;
		kick();
	});
	function syncPanel() {
		const narrow = root.clientWidth < NARROW_BELOW;
		brain.compact = narrow && !expanded;
		panel.dataset.compact = String(brain.compact);
		$("[data-act=enlarge]").textContent = expanded ? "show less" : "tap to enlarge";
		brain.layout();
	}
	brainCanvas.addEventListener("click", () => {
		if (brain.compact) {
			expanded = true;
			syncPanel();
		}
	});
	const ro = new ResizeObserver(() => {
		const w = root.clientWidth;
		if (!w) return;
		const wantPortrait = w < PORTRAIT_BELOW;
		if (wantPortrait !== portrait) {
			portrait = wantPortrait;
			root.dataset.portrait = String(portrait);
			setMap(transpose(map));
		} else arena.resize();
		syncPanel();
		dirty = true;
		kick();
	});
	ro.observe(root);
	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		lastT = 0;
		kick();
	});
	io.observe(root);
	const onVisibility = () => {
		pageVisible = !document.hidden;
		lastT = 0;
		kick();
	};
	document.addEventListener("visibilitychange", onVisibility);
	const stopTheme = watchTheme(() => requestAnimationFrame(() => {
		theme = readTheme(root);
		arena.theme = brain.theme = theme;
		brain.draw();
		dirty = true;
		kick();
	}));
	root.dataset.portrait = String(portrait);
	setTool(tool);
	setSpeed(1);
	arena.setWorld(map.width, map.height);
	syncPanel();
	syncStatus();
	setVersion(versionId);
	return { destroy() {
		cancelAnimationFrame(raf);
		raf = 0;
		loadToken++;
		ro.disconnect();
		io.disconnect();
		stopTheme();
		document.removeEventListener("visibilitychange", onVisibility);
		canvas.removeEventListener("touchstart", onTouchStart);
		root.remove();
	} };
}
//#endregion
export { BORDER_RAD, Episode, HeuristicPolicy, MLPPolicy, PRESETS, TIMEOUT, border, buildGrid, capCount, capsules, castRays, cellIndex, clearance, closestPoint, concatCaps, geodesicField, goalDim, goalDistance, lookup, mapCaps, mountMazeDemo, obsDim, obsNames, observe, physicsStep, polylineCapsules, presetMap, pushOut, rayCapsule, rayDirs, rdp, reachable, simParams, wrapAngle };
