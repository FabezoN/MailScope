import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { investigationService } from '../services/investigationService';
import type { Investigation, InvestigationStatus, RiskLevel } from '../types/investigation';

type Filter = 'ALL' | InvestigationStatus;

const FILTERS: { label: string; value: Filter; cls?: string }[] = [
  { label: 'ALL',        value: 'ALL' },
  { label: 'PENDING',    value: 'PENDING',    cls: 'status-pending' },
  { label: 'PROCESSING', value: 'PROCESSING', cls: 'status-processing' },
  { label: 'COMPLETED',  value: 'COMPLETED',  cls: 'status-completed' },
  { label: 'FAILED',     value: 'FAILED',     cls: 'status-failed' },
];

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const StatusBadge = ({ status }: { status: InvestigationStatus }) => (
  <span className={`status-badge ${status}`}>{status}</span>
);

const RiskBadge = ({ level }: { level: RiskLevel }) => (
  <span className={`risk-badge ${level.toLowerCase()}`}>{level}</span>
);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const countPlatforms = (inv: Investigation) => {
  if (!inv.result?.holehe) return null;
  const found = inv.result.holehe.filter(h => h.exists).length;
  const total = inv.result.holehe.length;
  return { found, total };
};

export default function InvestigationsPage() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => investigationService.findAll(),
    refetchInterval: (query) => {
      const list = query.state.data;
      const hasActive = list?.some(
        i => i.status === 'PENDING' || i.status === 'PROCESSING',
      );
      return hasActive ? 4000 : false;
    },
  });

  const filtered = filter === 'ALL'
    ? (data ?? [])
    : (data ?? []).filter(i => i.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">INVESTIGATIONS</h1>
        <p className="page-subtitle">
          {data
            ? `${data.length} investigation${data.length !== 1 ? 's' : ''} — ${data.filter(i => i.status === 'COMPLETED').length} completed`
            : 'Loading...'}
        </p>
      </div>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-btn${f.cls ? ` ${f.cls}` : ''}${filter === f.value ? ' active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {data && f.value !== 'ALL' && (
              <> ({data.filter(i => i.status === f.value).length})</>
            )}
            {data && f.value === 'ALL' && (
              <> ({data.length})</>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="inv-table">
          <div className="inv-table-head">
            <span className="inv-th">Email / Domain</span>
            <span className="inv-th">Status</span>
            <span className="inv-th">Risk</span>
            <span className="inv-th">Platforms</span>
            <span className="inv-th">Date</span>
            <span className="inv-th" />
          </div>
          <div className="inv-table-body">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-cell" style={{ width: '60%' }} />
                <div className="skeleton-cell" style={{ width: '80px' }} />
                <div className="skeleton-cell" style={{ width: '70px' }} />
                <div className="skeleton-cell" style={{ width: '60px' }} />
                <div className="skeleton-cell" style={{ width: '100px' }} />
                <div className="skeleton-cell" style={{ width: '20px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="state-box">
          <div className="state-box-icon">!</div>
          <div className="state-box-title">CONNECTION ERROR</div>
          <div className="state-box-sub">
            {(error as Error)?.message ?? 'Unable to reach the API'}
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="state-box">
          <div className="state-box-icon">_</div>
          <div className="state-box-title">
            {filter === 'ALL' ? 'NO INVESTIGATIONS YET' : `NO ${filter} INVESTIGATIONS`}
          </div>
          <div className="state-box-sub">
            {filter === 'ALL'
              ? 'Submit an email on the dashboard to start your first investigation.'
              : 'Try a different status filter.'}
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="inv-table">
          <div className="inv-table-head">
            <span className="inv-th">Email / Domain</span>
            <span className="inv-th">Status</span>
            <span className="inv-th">Risk</span>
            <span className="inv-th">Platforms</span>
            <span className="inv-th">Date</span>
            <span className="inv-th" />
          </div>
          <div className="inv-table-body">
            {filtered.map(inv => {
              const platforms = countPlatforms(inv);
              return (
                <Link key={inv.id} to={`/investigations/${inv.id}`} className="inv-row">
                  <div>
                    <div className="inv-email">{inv.email}</div>
                    {inv.result?.domain && (
                      <div className="inv-domain">{inv.result.domain}</div>
                    )}
                  </div>
                  <StatusBadge status={inv.status} />
                  <div className="inv-risk">
                    {inv.result?.score
                      ? <RiskBadge level={inv.result.score.level} />
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                  <div className="inv-platforms">
                    {platforms
                      ? <><span>{platforms.found}</span> / {platforms.total}</>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                  <div className="inv-date">{formatDate(inv.createdAt)}</div>
                  <div className="inv-arrow"><ArrowIcon /></div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
