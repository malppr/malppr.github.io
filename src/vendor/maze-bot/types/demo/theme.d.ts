export interface Theme {
    fg: string;
    bg: string;
    surface: string;
    border: string;
    muted: string;
    accent: string;
    accentFg: string;
    neg: string;
    sans: string;
    mono: string;
}
export declare function readTheme(el: HTMLElement): Theme;
/** Call `cb` when the page theme may have changed (class / data-theme / style on <html>, or the OS scheme). */
export declare function watchTheme(cb: () => void): () => void;
export declare function rgb(color: string): [number, number, number];
/** Mix two colours: t = 0 gives a, t = 1 gives b. */
export declare function mix(a: [number, number, number], b: [number, number, number], t: number): string;
