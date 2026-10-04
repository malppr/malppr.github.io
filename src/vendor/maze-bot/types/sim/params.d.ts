export type GoalInputs = 'sincos_dist' | 'sincos' | 'bearing';
export interface SimParams {
    radius: number;
    wheelBase: number;
    vMax: number;
    reverseMax: number;
    dt: number;
    frameSkip: number;
    rayAnglesDeg: number[];
    rayAngles: number[];
    rayRange: number;
    goalDistScale: number;
    goalRadius: number;
    goalInputs: GoalInputs;
    prevActionInputs: boolean;
}
/** Python `sim_params` dict (snake_case), as stored in weights.json. */
export interface SimParamsJson {
    radius?: number;
    wheel_base?: number;
    v_max?: number;
    reverse_max?: number;
    dt?: number;
    frame_skip?: number;
    ray_angles_deg?: number[];
    ray_range?: number;
    goal_dist_scale?: number;
    goal_radius?: number;
    goal_inputs?: GoalInputs;
    prev_action_inputs?: boolean;
}
export declare function simParams(d?: SimParamsJson): SimParams;
export declare function goalDim(p: SimParams): number;
export declare function obsDim(p: SimParams): number;
/** Human-readable input names, in order (mazebot/policy.py:obs_spec, shortened for the network panel). */
export declare function obsNames(p: SimParams): string[];
