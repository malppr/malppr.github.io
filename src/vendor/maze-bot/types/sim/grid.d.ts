import { type Caps } from './geometry';
export interface Grid {
    width: number;
    height: number;
    cell: number;
    nx: number;
    ny: number;
    free: Uint8Array;
    clear: Float64Array;
}
export declare function buildGrid(width: number, height: number, caps: Caps, robotRadius: number, cell?: number): Grid;
export declare function cellIndex(g: Grid, x: number, y: number): [number, number];
/**
 * Geodesic distance (world units) from (gx, gy) to every free cell; Infinity where unreachable. 8-connected,
 * diagonal moves only when both orthogonal neighbours are free. Seeds every free cell within `seedRadius`
 * (default 1.5 cells) of the point, so the field is ~0 at the goal even if the goal's own cell is blocked.
 */
export declare function geodesicField(g: Grid, gx: number, gy: number, seedRadius?: number): Float64Array;
/** Continuous geodesic distance at (x, y): min over nearby reached cells of field + straight line. */
export declare function lookup(g: Grid, dist: Float64Array, x: number, y: number, k?: number): number;
export declare function reachable(g: Grid, ax: number, ay: number, bx: number, by: number): boolean;
