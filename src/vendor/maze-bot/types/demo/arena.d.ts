import type { MazeMap, Pose } from '../sim/sim';
import { type Theme } from './theme';
export interface ArenaFrame {
    map: MazeMap;
    pose: Pose;
    rays: ArrayLike<number>;
    rayAngles: number[];
    rayRange: number;
    radius: number;
    trace: number[];
    stroke?: number[][];
    brush: number;
    eraser?: {
        x: number;
        y: number;
        r: number;
    };
    grab?: 'A' | 'B' | null;
}
export declare class ArenaView {
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private sprite;
    private w;
    private h;
    scale: number;
    theme: Theme;
    constructor(canvas: HTMLCanvasElement, spriteUrl?: string);
    setWorld(width: number, height: number): void;
    resize(): void;
    toWorld(clientX: number, clientY: number): [number, number];
    draw(f: ArenaFrame): void;
    private capsule;
    private marker;
    private robot;
}
