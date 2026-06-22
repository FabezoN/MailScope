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

const SENSITIVE_PORTS = new Set([21, 22, 23, 25, 110, 143, 445, 1433, 3306, 5432, 6379, 27017]);

export function computeScore(holehe: HoleheEntry[], leakix: LeakIXEntry[]): ScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  const found = holehe.filter(h => h.exists && !h.rateLimit);
  if (found.length > 0) {
    score += Math.min(found.length * 8, 40);
    reasons.push(`${found.length} compte(s) public(s) détecté(s) : ${found.map(h => h.platform).join(', ')}`);
    recommendations.push('Limitez la réutilisation de cet email sur des plateformes publiques');
  }

  const withRecovery = found.filter(h => h.emailRecovery);
  if (withRecovery.length > 0) {
    score += Math.min(withRecovery.length * 5, 15);
    reasons.push(`Email utilisé comme récupération sur : ${withRecovery.map(h => h.platform).join(', ')}`);
    recommendations.push('Désactivez la récupération par email sur les plateformes non critiques');
  }

  if (leakix.length > 0) {
    score += Math.min(leakix.length * 10, 20);
    reasons.push(`${leakix.length} exposition(s) détectée(s) sur le domaine via LeakIX`);
    recommendations.push('Auditez les services exposés sur Internet pour votre domaine');
  }

  const sensitivePorts = leakix.filter(l => SENSITIVE_PORTS.has(l.port));
  if (sensitivePorts.length > 0) {
    score += Math.min(sensitivePorts.length * 8, 24);
    const ports = [...new Set(sensitivePorts.map(l => l.port))];
    reasons.push(`Ports sensibles exposés : ${ports.join(', ')}`);
    recommendations.push('Fermez ou protégez les ports sensibles exposés sur Internet');
  }

  for (const entry of leakix) {
    if (entry.severity === 'critical') {
      score += 15;
      reasons.push(`Vulnérabilité critique sur ${entry.host}:${entry.port} (${entry.service})`);
      recommendations.push(`Corrigez immédiatement la vulnérabilité critique sur ${entry.host}`);
    } else if (entry.severity === 'high') {
      score += 10;
      reasons.push(`Exposition haute sévérité sur ${entry.host}:${entry.port} (${entry.service})`);
      recommendations.push(`Investiguer l'exposition sur ${entry.host}:${entry.port}`);
    }
  }

  const value = Math.min(score, 100);
  const level: RiskLevel =
    value <= 30 ? 'LOW' :
    value <= 60 ? 'MEDIUM' :
    value <= 85 ? 'HIGH' : 'CRITICAL';

  if (recommendations.length === 0) {
    recommendations.push('Aucune action immédiate requise — continuez à surveiller régulièrement');
  }

  return { value, level, reasons, recommendations };
}
