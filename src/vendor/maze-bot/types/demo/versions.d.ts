import type { WeightsJson } from '../policy/mlp';
export interface Version {
    id: string;
    name: string;
    blurb: string;
    load?: () => Promise<{
        default: unknown;
    }>;
}
export declare const VERSIONS: Version[];
export declare const DEFAULT_VERSION = "final";
export declare function loadWeights(v: Version): Promise<WeightsJson | null>;
