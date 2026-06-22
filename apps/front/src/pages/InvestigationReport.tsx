import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { investigationService } from '../services/investigationService';
import type { Investigation, OsintResult } from '../types/investigation';

/* ── Score ─────────────────────────────────────────────────── */

type Level = 'low' | 'medium' | 'high' | 'critical';

function computeScore(result: OsintResult): number {
  let s = 0;
  const found = result.holehe.filter(h => h.exists);
  s += found.length * 8;
  s += found.filter(h => h.emailRecovery).length * 5;
  result.leakix.forEach(l => {
    s += l.severity === 'critical' ? 25 : l.severity === 'high' ? 15 : l.severity === 'medium' ? 8 : 3;
  });
  return Math.min(100, s);
}

function getLevel(score: number): Level {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 85) return 'high';
  return 'critical';
}

const LEVEL_LABEL: Record<Level, string> = {
  low: 'LOW RISK',
  medium: 'MEDIUM RISK',
  high: 'HIGH RISK',
  critical: 'CRITICAL RISK',
};

const LEVEL_DESC: Record<Level, string> = {
  low: 'Faible exposition détectée. Profil relativement sûr.',
  medium: 'Exposition modérée. Quelques points de vigilance.',
  high: 'Exposition significative. Action recommandée.',
  critical: 'Exposition critique. Intervention urgente requise.',
};

/* ── Recommendations ────────────────────────────────────────── */

function buildRecommendations(result: OsintResult, level: Level): { icon: string; text: string }[] {
  const recs: { icon: string; text: string }[] = [];
  const found = result.holehe.filter(h => h.exists);
  const recovery = found.filter(h => h.emailRecovery);
  const criticalLeaks = result.leakix.filter(l => l.severity === 'critical' || l.severity === 'high');

  if (found.length > 5)
    recs.push({ icon: '>', text: `<strong>Réduire l'empreinte numérique</strong> — Cet email est associé à ${found.length} plateformes. Envisagez d'utiliser des alias email distincts par service.` });

  if (recovery.length > 0)
    recs.push({ icon: '>', text: `<strong>Revoir les emails de récupération</strong> — ${recovery.length} plateforme${recovery.length > 1 ? 's utilisent' : ' utilise'} cet email comme adresse de récupération. En cas de compromission, l'accès à ces comptes serait facilité.` });

  if (criticalLeaks.length > 0)
    recs.push({ icon: '!', text: `<strong>Vulnérabilités domaine critiques</strong> — ${criticalLeaks.length} exposition${criticalLeaks.length > 1 ? 's' : ''} de sévérité élevée détectée${criticalLeaks.length > 1 ? 's' : ''} sur le domaine. Contactez l'équipe sécurité.` });

  if (result.leakix.some(l => l.port === 22 || l.port === 3389))
    recs.push({ icon: '!', text: `<strong>Ports d'administration exposés</strong> — SSH (22) ou RDP (3389) détectés sur le domaine. Restreindre l'accès à ces ports via un pare-feu.` });

  if (level === 'low' || recs.length === 0)
    recs.push({ icon: '+', text: `<strong>Bonne pratique</strong> — Activez l'authentification à deux facteurs (2FA) sur toutes les plateformes où cet email est enregistré.` });

  recs.push({ icon: '~', text: `<strong>Surveillance régulière</strong> — Répétez cette analyse périodiquement. Les fuites de données et nouvelles expositions évoluent dans le temps.` });

  return recs;
}

/* ── Helpers ────────────────────────────────────────────────── */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/* ── Icons ──────────────────────────────────────────────────── */

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/* ── Sub-components ─────────────────────────────────────────── */

const StatusBadge = ({ status }: { status: Investigation['status'] }) => (
  <span className={`status-badge ${status}`}>{status}</span>
);

const SeverityBadge = ({ s }: { s: string }) => (
  <span className={`severity-badge ${s}`}>{s}</span>
);

/* ── Page ───────────────────────────────────────────────────── */

export default function InvestigationReportPage() {
  const { id } = useParams<{ id: string }>();

  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => investigationService.findOne(id!),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'PENDING' || s === 'PROCESSING' ? 3000 : false;
    },
    enabled: !!id,
  });

  return (
    <div className="page">
      <Link to="/investigations" className="report-back">
        <BackIcon /> BACK TO INVESTIGATIONS
      </Link>

      {isLoading && (
        <div className="report-waiting">
          <div className="state-box-icon">_</div>
          <div className="report-waiting-title">LOADING REPORT...</div>
          <span className="terminal-cursor" />
        </div>
      )}

      {isError && (
        <div className="report-error-msg">
          ERREUR — Impossible de charger l'investigation.
        </div>
      )}

      {inv && (
        <>
          {/* Header */}
          <div className="report-header">
            <div className="report-email">{inv.email}</div>
            {inv.result?.domain && (
              <div className="report-domain">@ {inv.result.domain}</div>
            )}
            <div className="report-meta">
              <StatusBadge status={inv.status} />
              <span className="meta-chip">
                <span className="meta-chip-label">DATE</span>
                {formatDate(inv.createdAt)}
              </span>
              {inv.result?.durationMs != null && (
                <span className="meta-chip">
                  <span className="meta-chip-label">DURÉE</span>
                  {formatDuration(inv.result.durationMs)}
                </span>
              )}
              <span className="meta-chip" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {inv.id}
              </span>
            </div>
          </div>

          {/* Pending / Processing */}
          {(inv.status === 'PENDING' || inv.status === 'PROCESSING') && (
            <div className="report-waiting">
              <div className="report-waiting-title">
                {inv.status === 'PENDING' ? 'EN ATTENTE DE TRAITEMENT...' : 'ANALYSE EN COURS...'}
              </div>
              <div className="report-waiting-sub">La page se rafraîchit automatiquement.</div>
              <div className="scan-progress" style={{ width: '100%', maxWidth: 300 }}>
                <div className="progress-track"><div className="progress-fill" /></div>
              </div>
            </div>
          )}

          {/* Failed */}
          {inv.status === 'FAILED' && (
            <div className="report-error-msg">
              ANALYSE ÉCHOUÉE — {inv.errorMessage ?? 'Erreur inconnue.'}
            </div>
          )}

          {/* Completed */}
          {inv.status === 'COMPLETED' && inv.result && (() => {
            const score = computeScore(inv.result);
            const level = getLevel(score);
            const recs = buildRecommendations(inv.result, level);
            const foundPlatforms = inv.result.holehe.filter(h => h.exists);

            return (
              <>
                {/* Score */}
                <div className="score-section">
                  <div className="score-card">
                    <div className={`score-number ${level}`}>{score}</div>
                    <div className="score-info">
                      <span className={`score-level ${level}`}>{LEVEL_LABEL[level]}</span>
                      <div className="score-desc">{LEVEL_DESC[level]}</div>
                    </div>
                  </div>
                </div>

                {/* Holehe + LeakIX */}
                <div className="report-grid">
                  <div className="section-card">
                    <div className="section-header">
                      <span className="section-title">HOLEHE — PLATFORMS</span>
                      <span className="section-count">{foundPlatforms.length} / {inv.result.holehe.length} found</span>
                    </div>
                    <div className="section-body">
                      {inv.result.holehe.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune donnée Holehe.</div>
                      ) : (
                        <div className="platform-grid">
                          {inv.result.holehe.map((p, i) => (
                            <div key={i} className={`platform-item ${p.exists ? 'found' : 'not-found'}`}>
                              <div className="platform-name">{p.platform}</div>
                              <div className="platform-tags">
                                {p.exists
                                  ? <span className="platform-tag found-tag">FOUND</span>
                                  : <span className="platform-tag absent-tag">ABSENT</span>
                                }
                                {p.exists && p.emailRecovery && (
                                  <span className="platform-tag recovery-tag">RECOVERY</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-header">
                      <span className="section-title">LEAKIX — EXPOSURES</span>
                      <span className="section-count">{inv.result.leakix.length} found</span>
                    </div>
                    <div className="section-body">
                      {inv.result.leakix.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune exposition détectée.</div>
                      ) : (
                        <table className="leakix-table">
                          <thead>
                            <tr>
                              <th>HOST</th>
                              <th>PORT</th>
                              <th>SERVICE</th>
                              <th>SEVERITY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.result.leakix.map((l, i) => (
                              <tr key={i}>
                                <td style={{ color: 'var(--text-h)' }}>{l.ip}</td>
                                <td style={{ color: 'var(--cyan)' }}>{l.port}</td>
                                <td>{l.service}</td>
                                <td><SeverityBadge s={l.severity} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="section-card full">
                    <div className="section-header">
                      <span className="section-title">RECOMMENDATIONS</span>
                      <span className="section-count">{recs.length}</span>
                    </div>
                    <div className="section-body">
                      <div className="rec-list">
                        {recs.map((r, i) => (
                          <div key={i} className="rec-item">
                            <span className="rec-icon" style={{ color: 'var(--accent)' }}>{r.icon}</span>
                            <span
                              className="rec-text"
                              dangerouslySetInnerHTML={{ __html: r.text }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
