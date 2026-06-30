export interface HoleheEntry {
    platform: string;
    exists: boolean;
    emailRecovery: boolean;
    rateLimit: boolean;
}
export interface XonBreachEntry {
    breach: string;
    passwordRisk: string;
    xposedRecords: number;
}
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ScoreResult {
    value: number;
    level: RiskLevel;
    reasons: string[];
    recommendations: string[];
}
export declare function computeScore(holehe: HoleheEntry[], xon: XonBreachEntry[]): ScoreResult;
//# sourceMappingURL=scoring.d.ts.map
