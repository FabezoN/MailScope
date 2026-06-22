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

export function computeScore(holehe: HoleheEntry[], xon: XonBreachEntry[]): ScoreResult {
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

  if (xon.length > 0) {
    score += Math.min(xon.length * 8, 40);
    reasons.push(`${xon.length} fuite(s) de données détectée(s) : ${xon.map(b => b.breach).join(', ')}`);
    recommendations.push('Changez vos mots de passe sur les services compromis');
  }

  const highRisk = xon.filter(b => b.passwordRisk.toLowerCase() === 'high');
  if (highRisk.length > 0) {
    score += Math.min(highRisk.length * 5, 15);
    reasons.push(`Mots de passe à haut risque exposés dans : ${highRisk.map(b => b.breach).join(', ')}`);
    recommendations.push('Vos mots de passe sont facilement récupérables — changez-les immédiatement');
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
