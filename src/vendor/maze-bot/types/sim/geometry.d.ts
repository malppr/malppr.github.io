export type Caps = Float64Array;
export declare const capCount: (caps: Caps) => number;
export declare function capsules(rows: ArrayLike<number>[]): Caps;
export declare function concatCaps(...parts: Caps[]): Caps;
/** Four capsules on the arena edges (their inner surface is `rad` inside the arena). */
export declare function border(w: number, h: number, rad?: number): Caps;
/** Closest point on capsule i's core segment to (px, py) and the distance to it. Writes into `out`. */
export declare function closestPoint(px: number, py: number, caps: Caps, i: number, out: Float64Array): void;
/** Distance from a point to the nearest capsule surface (negative inside a wall). */
export declare function clearance(px: number, py: number, caps: Caps): number;
/** First hit distance of one ray (unit direction dx, dy) on capsule i, Infinity on a miss (iq's capsule test). */
export declare function rayCapsule(ox: number, oy: number, dx: number, dy: number, caps: Caps, i: number): number;
/** Distance along each unit direction (dirs = [dx0, dy0, dx1, dy1, ...]) to the first hit, capped at maxRange. */
export declare function castRays(ox: number, oy: number, dirs: ArrayLike<number>, caps: Caps, maxRange: number): Float64Array;
/**
 * Move a circle of radius r at (px, py) out of any capsule it overlaps. Each iteration resolves the deepest
 * overlap (first index on ties) along its contact normal, so the robot slides along walls.
 */
export declare function pushOut(px: number, py: number, r: number, caps: Caps, iters?: number): {
    x: number;
    y: number;
    contact: boolean;
};
/** Ramer-Douglas-Peucker polyline simplification. points: [[x, y], ...]. */
export declare function rdp(points: number[][], eps: number): number[][];
/** Chain of capsules along a polyline (consecutive points); a single point becomes a post. */
export declare function polylineCapsules(points: number[][], rad: number): Caps;
