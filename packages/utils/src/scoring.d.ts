export interface HoleheEntry {
    platform: string;
    exists: boolean;
    emailRecovery: boolean;
    rateLimit: boolean;
}
export interface LeakIXEntry {
    host: string;
    ip: string;
    port: number;
    protocol: string;
    service: string;
    severity: string;
}
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ScoreResult {
    value: number;
    level: RiskLevel;
    reasons: string[];
    recommendations: string[];
}
export declare function computeScore(holehe: HoleheEntry[], leakix: LeakIXEntry[]): ScoreResult;
//# sourceMappingURL=scoring.d.ts.map