import { type Caps } from './geometry';
import { type Grid } from './grid';
import { type SimParams } from './params';
export declare const BORDER_RAD = 0.05;
/** Wrap to (-pi, pi]. JS % on doubles is C fmod, like Python's math.fmod. */
export declare function wrapAngle(a: number): number;
export interface Pose {
    x: number;
    y: number;
    th: number;
}
/**
 * Advance one physics step in place; returns whether the robot touched a wall. Differential drive with the
 * body speed floored at -reverseMax * vMax; midpoint integration, sub-stepped so the centre never moves more
 * than r/2 per sub-step.
 */
export declare function physicsStep(s: Pose, ul: number, ur: number, caps: Caps, p: SimParams): boolean;
export declare function rayDirs(th: number, p: SimParams): Float64Array;
/**
 * Sensor part of the observation (rays / range, then goal inputs; the episode appends the memory inputs).
 * Bearing via dot/cross products: sin > 0 means the goal is clockwise (to the right on screen).
 */
export declare function observe(x: number, y: number, th: number, gx: number, gy: number, caps: Caps, p: SimParams): {
    obs: Float64Array<ArrayBuffer>;
    rays: Float64Array<ArrayBufferLike>;
};
export declare function goalDistance(x: number, y: number, gx: number, gy: number): number;
/** A layout: arena size, interior walls ([ax, ay, bx, by, rad] rows), start [x, y, th], goal [x, y]. */
export interface MazeMap {
    name?: string;
    width: number;
    height: number;
    walls: number[][];
    start: [number, number, number];
    goal: [number, number];
}
/** All capsules of a map: the arena border first, then the walls (same order as mapgen.Map.caps). */
export declare function mapCaps(m: MazeMap): Caps;
export interface Timeout {
    factor: number;
    slack: number;
}
export declare const TIMEOUT: Timeout;
export interface StepResult {
    success: boolean;
    lost: boolean;
    contact: boolean;
}
/**
 * One drive from A to B (mirrors MazeEnv.reset/step without rewards). `observation()` is exactly what the
 * Python policy saw: float32-rounded, with the previous clipped action appended when the sim uses memory.
 */
export declare class Episode {
    private timeout;
    readonly p: SimParams;
    map: MazeMap;
    caps: Caps;
    grid: Grid;
    field: Float64Array;
    pose: Pose;
    rays: Float64Array;
    sensors: Float64Array;
    prevAction: [number, number];
    steps: number;
    maxSteps: number;
    geo0: number;
    done: 'success' | 'lost' | null;
    constructor(map: MazeMap, p: SimParams, timeout?: Timeout);
    /** Swap in a new layout (walls / A / B) and restart. */
    setMap(map: MazeMap): void;
    /**
     * Change walls mid-drive (demo drawing): Wheely keeps its pose and memory. With `replan`, the path grid
     * is rebuilt and the time limit extended to cover the path from where Wheely is now. Returns whether B
     * is reachable from Wheely's position (only meaningful with `replan`).
     */
    updateWalls(walls: number[][], replan: boolean): boolean;
    /** Policy steps allowed for a path of length `geo` (no path: straight-line distance, so "lost" still happens). */
    private limitSteps;
    reset(): void;
    get reachable(): boolean;
    /** Is B reachable from (x, y) with the current walls (as of the last grid rebuild)? */
    reachableFrom(x: number, y: number): boolean;
    private sense;
    /** Policy input: sensors (+ previous action), rounded to float32 like the Python env. */
    observation(): Float64Array;
    /** One policy step: frameSkip physics steps, stopping early on reaching B. */
    step(action: ArrayLike<number>): StepResult;
}
