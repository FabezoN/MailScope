export type InvestigationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface HolehePlatform {
  platform: string;
  exists: boolean;
  emailRecovery: boolean;
  rateLimit: boolean;
}

export interface LeakIXExposure {
  host: string;
  ip: string;
  port: number;
  protocol: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OsintResult {
  email: string;
  domain: string;
  scannedAt: string;
  durationMs: number;
  holehe: HolehePlatform[];
  leakix: LeakIXExposure[];
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
