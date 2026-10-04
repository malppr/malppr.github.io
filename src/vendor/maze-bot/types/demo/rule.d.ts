import type { RuleTrace } from '../policy/heuristic';
export declare class RuleView {
    readonly el: HTMLElement;
    private bars;
    private rules;
    private goal;
    private goalText;
    constructor();
    update(t: RuleTrace, action: [number, number]): void;
}
