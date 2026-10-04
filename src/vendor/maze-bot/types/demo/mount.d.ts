export interface MazeDemoOptions {
    mode?: 'obstacles' | 'draw';
    showNetwork?: boolean;
    version?: string;
    sprite?: string;
}
export interface MazeDemoHandle {
    destroy(): void;
}
export declare function mountMazeDemo(el: HTMLElement, opts?: MazeDemoOptions): MazeDemoHandle;
