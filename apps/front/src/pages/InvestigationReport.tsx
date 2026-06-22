import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investigationService } from '../services/investigationService';
import type { HolehePlatform, Investigation, RiskLevel } from '../types/investigation';

const LEVEL_LABEL: Record<RiskLevel, string> = {
  LOW: 'LOW RISK',
  MEDIUM: 'MEDIUM RISK',
  HIGH: 'HIGH RISK',
  CRITICAL: 'CRITICAL RISK',
};

const LEVEL_DESC: Record<RiskLevel, string> = {
  LOW: 'Faible exposition détectée. Profil relativement sûr.',
  MEDIUM: 'Exposition modérée. Quelques points de vigilance.',
  HIGH: 'Exposition significative. Action recommandée.',
  CRITICAL: 'Exposition critique. Intervention urgente requise.',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDuration = (ms: number) =>
  ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const StatusBadge = ({ status }: { status: Investigation['status'] }) => (
  <span className={`status-badge ${status}`}>{status}</span>
);

type HolehFilter = 'found' | 'not-found' | 'all';

function HolehePlatforms({ platforms }: { platforms: HolehePlatform[] }) {
  const [filter, setFilter] = useState<HolehFilter>('found');

  const displayed = platforms.filter(p =>
    filter === 'all'       ? true :
    filter === 'found'     ? p.exists :
                             !p.exists,
  );

  const foundCount = platforms.filter(p => p.exists).length;

  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-title">HOLEHE — PLATFORMS</span>
        <div className="holehe-filters">
          {(['found', 'not-found', 'all'] as HolehFilter[]).map(f => (
            <button
              key={f}
              className={`holehe-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'found' ? `FOUND (${foundCount})` : f === 'not-found' ? `ABSENT (${platforms.length - foundCount})` : `ALL (${platforms.length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="section-body platform-scroll">
        {platforms.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune donnée Holehe.</div>
        ) : displayed.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun résultat pour ce filtre.</div>
        ) : (
          <div className="platform-grid">
            {displayed.map((p, i) => (
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
                  {p.rateLimit && (
                    <span className="platform-tag ratelimit-tag">RATE LIMIT</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvestigationReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => investigationService.findOne(id!),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'PENDING' || s === 'PROCESSING' ? 3000 : false;
    },
    enabled: !!id,
  });

  const retryMutation = useMutation({
    mutationFn: () => investigationService.retry(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investigation', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => investigationService.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      navigate('/investigations');
    },
  });

  const canRetry = inv?.status === 'COMPLETED' || inv?.status === 'FAILED';
  const canDelete = inv?.status !== 'PROCESSING';

  return (
    <div className="page">
      <div className="report-nav">
        <Link to="/investigations" className="report-back">
          <BackIcon /> BACK TO INVESTIGATIONS
        </Link>
        {inv && (
          <div className="report-actions">
            {canRetry && (
              <button
                className="action-btn retry-btn"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
              >
                ↺ {retryMutation.isPending ? 'RELANCING...' : 'RETRY'}
              </button>
            )}
            {canDelete && (
              <button
                className="action-btn delete-btn"
                onClick={() => {
                  if (window.confirm('Supprimer cette investigation ?')) deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                ✕ {deleteMutation.isPending ? 'DELETING...' : 'DELETE'}
              </button>
            )}
          </div>
        )}
      </div>

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

          {inv.status === 'FAILED' && (
            <div className="report-error-msg">
              ANALYSE ÉCHOUÉE — {inv.errorMessage ?? 'Erreur inconnue.'}
            </div>
          )}

          {inv.status === 'COMPLETED' && inv.result && (() => {
            const { score, holehe, xon } = inv.result;
            const levelClass = score.level.toLowerCase();

            return (
              <>
                <div className="score-section">
                  <div className="score-card">
                    <div className={`score-number ${levelClass}`}>{score.value}</div>
                    <div className="score-info">
                      <span className={`score-level ${levelClass}`}>{LEVEL_LABEL[score.level]}</span>
                      <div className="score-desc">{LEVEL_DESC[score.level]}</div>
                    </div>
                  </div>
                </div>

                <div className="report-grid">

                  <HolehePlatforms platforms={holehe} />

                  <div className="section-card">
                    <div className="section-header">
                      <span className="section-title">XPOSEDORNOT — DATA BREACHES</span>
                      <span className="section-count">{xon.length} breach{xon.length !== 1 ? 'es' : ''} found</span>
                    </div>
                    <div className="section-body xon-scroll">
                      {xon.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucune fuite de données détectée.</div>
                      ) : (
                        <div className="xon-list">
                          {xon.map((b, i) => (
                            <div key={i} className="xon-item">
                              <div className="xon-header">
                                <span className="xon-name">{b.breach}</span>
                                <div className="xon-meta">
                                  <span className="xon-date">{b.xposedDate}</span>
                                  <span className="xon-records">{b.xposedRecords.toLocaleString()} records</span>
                                  <span className={`xon-risk ${b.passwordRisk.toLowerCase()}`}>{b.passwordRisk}</span>
                                  {b.verified && <span className="xon-verified">✓ VERIFIED</span>}
                                </div>
                              </div>
                              <div className="xon-domain">{b.domain} — {b.industry}</div>
                              <div className="xon-data-tags">
                                {b.xposedData.map((d, j) => (
                                  <span key={j} className="xon-data-tag">{d}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-header">
                      <span className="section-title">RISK FACTORS</span>
                      <span className="section-count">{score.reasons.length}</span>
                    </div>
                    <div className="section-body">
                      {score.reasons.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun facteur de risque détecté.</div>
                      ) : (
                        <div className="rec-list">
                          {score.reasons.map((r, i) => (
                            <div key={i} className="rec-item">
                              <span className="rec-icon" style={{ color: 'var(--red)' }}>!</span>
                              <span className="rec-text">{r}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-header">
                      <span className="section-title">RECOMMENDATIONS</span>
                      <span className="section-count">{score.recommendations.length}</span>
                    </div>
                    <div className="section-body">
                      <div className="rec-list">
                        {score.recommendations.map((r, i) => (
                          <div key={i} className="rec-item">
                            <span className="rec-icon" style={{ color: 'var(--accent)' }}>{'>'}</span>
                            <span className="rec-text">{r}</span>
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
