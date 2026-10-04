import type { MLPPolicy } from '../policy/mlp';
import { type Theme } from './theme';
export declare class BrainView {
    readonly canvas: HTMLCanvasElement;
    private ctx;
    private net;
    private names;
    private layers;
    private xs;
    private ys;
    private nodeR;
    private cssW;
    private cssH;
    private focus;
    compact: boolean;
    theme: Theme;
    constructor(canvas: HTMLCanvasElement);
    setNet(net: MLPPolicy, names: string[]): void;
    update(layers: Float64Array[]): void;
    layout(): void;
    private setFocus;
    private hit;
    draw(): void;
    private linked;
    private edge;
    private text;
}
