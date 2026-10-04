import { type SimParams } from '../sim/params';
export interface RuleTrace {
    left: number;
    right: number;
    front: number;
    bearing: number;
    rule: 'seek' | 'keep-wall-right' | 'keep-wall-left' | 'avoid';
    turn: number;
    speed: number;
}
export declare class HeuristicPolicy {
    readonly sim: SimParams;
    readonly arch: null;
    act(obs: ArrayLike<number>): {
        action: [number, number];
        trace: RuleTrace;
    };
    reset(): void;
}
