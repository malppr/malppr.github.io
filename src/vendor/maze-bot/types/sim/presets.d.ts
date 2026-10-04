import type { MazeMap } from './sim';
export interface Preset {
    name: string;
    width: number;
    height: number;
    walls: number[][];
    start: number[];
    goal: number[];
}
export declare const PRESETS: Preset[];
/** Port of mapgen.preset_map: portrait swaps x/y of every point and maps heading th to pi/2 - th. */
export declare function presetMap(p: Preset, portrait?: boolean): MazeMap;
