export type InvestigationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HolehePlatform {
  platform: string;
  exists: boolean;
  emailRecovery: boolean;
  rateLimit: boolean;
}

export interface XonBreach {
  breach: string;
  domain: string;
  industry: string;
  passwordRisk: string;
  xposedData: string[];
  xposedDate: string;
  xposedRecords: number;
  verified: boolean;
}

export interface Score {
  value: number;
  level: RiskLevel;
  reasons: string[];
  recommendations: string[];
}

export interface OsintResult {
  email: string;
  domain: string;
  scannedAt: string;
  durationMs: number;
  score: Score;
  holehe: HolehePlatform[];
  xon: XonBreach[];
}

export interface Investigation {
  id: string;
  email: string;
  userId: string;
  status: InvestigationStatus;
  result: OsintResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
