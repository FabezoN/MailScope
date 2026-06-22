import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MatrixRain from '../components/MatrixRain';
import { investigationService } from '../services/investigationService';
import { fetchHealth } from '../services/healthService';
import type { Investigation } from '../types/investigation';
import type { HealthResponse } from '../services/healthService';

type TerminalLine = {
  text: string;
  cls: 't-default' | 't-green' | 't-cyan' | 't-red' | 't-dim' | 't-bright';
};

type ScanPhase = 'idle' | 'creating' | 'pending' | 'processing' | 'done' | 'error';

const PHASE_LABEL: Record<Exclude<ScanPhase, 'idle'>, string> = {
  creating:   'CREATING INVESTIGATION...',
  pending:    'PENDING — AWAITING JOB RUNNER',
  processing: 'PROCESSING — OSINT ANALYSIS IN PROGRESS',
  done:       'COMPLETE',
  error:      'ERROR',
};

const PHASE_PROGRESS: Record<ScanPhase, number> = {
  idle:       0,
  creating:   15,
  pending:    35,
  processing: 70,
  done:       100,
  error:      0,
};

const SERVICE_DISPLAY: { key: string; label: string }[] = [
  { key: 'auth-service',           label: 'AUTH SERVICE' },
  { key: 'osint-service',          label: 'OSINT SERVICE (HOLEHE)' },
  { key: 'investigations-service', label: 'INVESTIGATIONS SERVICE' },
];

function buildIdleLines(health: HealthResponse | undefined): TerminalLine[] {
  const out: TerminalLine[] = [
    { text: 'MAILSCOPE OSINT ENGINE v1.0.0 — INITIALIZED', cls: 't-green' },
  ];

  if (!health) {
    out.push({ text: 'CHECKING SYSTEM STATUS...', cls: 't-dim' });
    return out;
  }

  for (const { key, label } of SERVICE_DISPLAY) {
    const svc = health.details[key];
    out.push(
      svc?.status === 'up'
        ? { text: `${label}: ONLINE`,  cls: 't-dim' }
        : { text: `${label}: OFFLINE`, cls: 't-red' },
    );
    if (key === 'osint-service') {
      out.push({ text: 'XPOSEDORNOT API: ONLINE (EXTERNAL)', cls: 't-dim' });
    }
  }

  const invUp = health.details['investigations-service']?.status === 'up';
  out.push(
    invUp
      ? { text: 'JOB RUNNER: ONLINE',  cls: 't-dim' }
      : { text: 'JOB RUNNER: UNKNOWN', cls: 't-dim' },
  );

  out.push(
    health.status === 'ok'
      ? { text: 'ALL SYSTEMS NOMINAL — AWAITING TARGET', cls: 't-default' }
      : { text: 'DEGRADED — SOME SERVICES UNAVAILABLE',  cls: 't-red' },
  );

  return out;
}

export default function DashboardPage() {
  const [email, setEmail]       = useState('');
  const [phase, setPhase]       = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [lines, setLines]       = useState<TerminalLine[]>([]);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const termBodyRef = useRef<HTMLDivElement>(null);
  const abortRef    = useRef(false);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const idleLines = buildIdleLines(health);

  const displayedLines = phase === 'idle' ? idleLines : lines;

  useEffect(() => {
    if (termBodyRef.current)
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
  }, [displayedLines]);

  const addLine = (text: string, cls: TerminalLine['cls']) =>
    setLines(prev => [...prev, { text, cls }]);

  const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const go = (p: ScanPhase) => {
    setPhase(p);
    setProgress(PHASE_PROGRESS[p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim();
    const canSubmit = phase === 'idle' || phase === 'done' || phase === 'error';
    if (!target || !canSubmit) return;

    abortRef.current = false;
    setCompletedId(null);
    setLines([{ text: `TARGET ACQUIRED: ${target.toUpperCase()}`, cls: 't-bright' }]);
    go('creating');

    await delay(350);
    addLine('INITIALIZING OSINT SEQUENCE...', 't-default');
    await delay(450);
    addLine('SUBMITTING TARGET TO ANALYSIS QUEUE...', 't-cyan');

    let inv: Investigation;
    try {
      inv = await investigationService.create(target);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        'API unreachable';
      addLine(`ERROR — ${msg}`, 't-red');
      go('error');
      return;
    }

    addLine(`INVESTIGATION CREATED — ID: ${inv.id}`, 't-dim');
    go('pending');
    addLine('AWAITING JOB RUNNER...', 't-default');

    let shownProcessing = false;

    while (!abortRef.current) {
      await delay(1200);

      let current: Investigation;
      try {
        current = await investigationService.findOne(inv.id);
      } catch {
        addLine('ERROR — Failed to reach API during polling', 't-red');
        go('error');
        return;
      }

      if (current.status === 'PROCESSING' && !shownProcessing) {
        shownProcessing = true;
        go('processing');
        addLine('JOB RUNNER — PROCESSING STARTED', 't-cyan');
        addLine('HOLEHE — SCANNING PLATFORM REGISTRATIONS...', 't-cyan');
        addLine('XPOSEDORNOT — CHECKING BREACH DATABASE...', 't-cyan');
        addLine('COMPUTING RISK SCORE...', 't-default');
      }

      if (current.status === 'COMPLETED' || current.status === 'FAILED') {
        if (!shownProcessing) {
          go('processing');
          addLine('JOB RUNNER — PROCESSED', 't-dim');
          addLine('HOLEHE — SCAN COMPLETE', 't-dim');
          addLine('XPOSEDORNOT — SCAN COMPLETE', 't-dim');
          await delay(150);
        }

        if (current.status === 'COMPLETED' && current.result) {
          const { score } = current.result;
          addLine(
            `INVESTIGATION COMPLETE — RISK: ${score.level} (${score.value}/100)`,
            't-green',
          );
          go('done');
          setCompletedId(inv.id);
        } else {
          addLine(
            `INVESTIGATION FAILED — ${current.errorMessage ?? 'Unknown error'}`,
            't-red',
          );
          go('error');
        }

        setEmail('');
        return;
      }
    }
  };

  const scanning = phase === 'creating' || phase === 'pending' || phase === 'processing';

  return (
    <div className="dashboard">
      <MatrixRain />

      <div className="dashboard-hero">
        <h1 className="dashboard-title">MAILSCOPE</h1>
        <p className="dashboard-subtitle">OSINT EMAIL INVESTIGATION PLATFORM</p>
        <div className="dashboard-divider" />
      </div>

      <div className="scan-card">
        <div className="scan-card-header">
          <span className="window-dot close" />
          <span className="window-dot min" />
          <span className="window-dot max" />
          <span className="scan-card-title">// NEW INVESTIGATION</span>
        </div>
        <form className="scan-form" onSubmit={handleSubmit}>
          <div className="scan-input-row">
            <div className="scan-input-wrapper">
              <span className="scan-prompt">TARGET:</span>
              <input
                className="scan-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="enter email address to investigate..."
                required
                disabled={scanning}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className={`scan-btn${scanning ? ' scanning' : ''}`}
              disabled={scanning}
            >
              {scanning ? 'SCANNING...' : 'EXECUTE'}
            </button>
          </div>
        </form>
      </div>

      <div className="terminal">
        <div className="terminal-header">
          <span className="window-dot close" />
          <span className="window-dot min" />
          <span className="window-dot max" />
          <span className="terminal-title">// INVESTIGATION OUTPUT</span>
        </div>
        <div className="terminal-body" ref={termBodyRef}>
          {displayedLines.map((line, i) => (
            <div key={i} className="terminal-line">
              <span className="terminal-prompt">{'>'}</span>
              <span className={line.cls}>{line.text}</span>
            </div>
          ))}

          {phase !== 'idle' && (
            <div className="scan-progress">
              <div className={`progress-label${phase === 'done' ? ' done' : phase === 'error' ? ' error' : ''}`}>
                {PHASE_LABEL[phase as Exclude<ScanPhase, 'idle'>]}
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill${phase === 'processing' ? ' processing' : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {phase === 'done' && completedId && (
            <div className="terminal-line terminal-action-line">
              <span className="terminal-prompt">{'>'}</span>
              <Link to={`/investigations/${completedId}`} className="terminal-report-link">
                VIEW FULL REPORT →
              </Link>
            </div>
          )}

          {!scanning && (
            <div className="terminal-line" style={{ marginTop: 4 }}>
              <span className="terminal-prompt">{'>'}</span>
              <span className="t-default">
                {phase === 'done'  && <span className="t-green"> SCAN COMPLETE</span>}
                {phase === 'error' && <span className="t-red"> SCAN FAILED</span>}
                {phase === 'idle'  && ' '}
                <span className="terminal-cursor" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
