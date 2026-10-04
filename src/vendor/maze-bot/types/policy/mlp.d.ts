import { type SimParams, type SimParamsJson } from '../sim/params';
export interface WeightsJson {
    version: number;
    arch: number[];
    hidden_activation: 'tanh';
    output: 'clip';
    obs_spec?: string[];
    act_spec?: string[];
    sim_params?: SimParamsJson;
    W: number[][][];
    b: number[][];
    meta?: Record<string, unknown>;
}
export interface PolicyOutput {
    action: [number, number];
    /** Every layer for the network panel: [input, hidden..., output before clipping]. */
    layers: Float64Array[];
}
export declare class MLPPolicy {
    readonly arch: number[];
    readonly sim: SimParams;
    readonly W: Float64Array[];
    readonly b: Float64Array[];
    constructor(w: WeightsJson);
    /** Weight from neuron i of layer k to neuron j of layer k + 1. */
    weight(k: number, j: number, i: number): number;
    forward(obs: ArrayLike<number>): PolicyOutput;
    reset(): void;
}
