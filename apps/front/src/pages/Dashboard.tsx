import { useState, useRef, useEffect } from 'react';
import MatrixRain from '../components/MatrixRain';

type TerminalLine = {
  text: string;
  cls: 't-default' | 't-green' | 't-cyan' | 't-red' | 't-dim' | 't-bright';
};

const IDLE_LINES: TerminalLine[] = [
  { text: 'MAILSCOPE OSINT ENGINE v1.0.0 — INITIALIZED', cls: 't-green' },
  { text: 'HOLEHE MODULE: ONLINE', cls: 't-dim' },
  { text: 'LEAKIX MODULE: ONLINE', cls: 't-dim' },
  { text: 'SCORING ENGINE: ONLINE', cls: 't-dim' },
  { text: 'ALL SYSTEMS NOMINAL — AWAITING TARGET', cls: 't-default' },
];

const SCAN_STEPS: TerminalLine[] = [
  { text: 'INITIALIZING OSINT SEQUENCE...', cls: 't-default' },
  { text: 'ESTABLISHING ENCRYPTED CHANNEL...', cls: 't-dim' },
  { text: 'SUBMITTING TARGET TO ANALYSIS QUEUE...', cls: 't-cyan' },
  { text: 'HOLEHE — SCANNING PLATFORM REGISTRATIONS...', cls: 't-cyan' },
  { text: 'LEAKIX — QUERYING DOMAIN EXPOSURE DATABASE...', cls: 't-cyan' },
  { text: 'AGGREGATING INTELLIGENCE DATA...', cls: 't-default' },
  { text: 'COMPUTING RISK SCORE...', cls: 't-default' },
  { text: 'GENERATING INVESTIGATION REPORT...', cls: 't-default' },
];

const DONE_LINE: TerminalLine = {
  text: 'INVESTIGATION QUEUED — VIEW RESULTS IN INVESTIGATIONS',
  cls: 't-green',
};

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>(IDLE_LINES);
  const [done, setDone] = useState(false);
  const termBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || scanning) return;

    setScanning(true);
    setDone(false);
    setLines([{ text: `TARGET ACQUIRED: ${email.toUpperCase()}`, cls: 't-bright' }]);

    for (const step of SCAN_STEPS) {
      await new Promise<void>(r => setTimeout(r, 550 + Math.random() * 450));
      setLines(prev => [...prev, step]);
    }

    // TODO: call investigationService.create(email) here
    await new Promise<void>(r => setTimeout(r, 400));
    setLines(prev => [...prev, DONE_LINE]);
    setScanning(false);
    setDone(true);
    setEmail('');
  };

  return (
    <div className="dashboard">
      <MatrixRain />

      <div className="dashboard-hero">
        <h1 className="dashboard-title">MAILSCOPE</h1>
        <p className="dashboard-subtitle">OSINT EMAIL INVESTIGATION PLATFORM</p>
        <div className="dashboard-divider" />
      </div>

      {/* Scan card */}
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

      {/* Terminal output */}
      <div className="terminal">
        <div className="terminal-header">
          <span className="window-dot close" />
          <span className="window-dot min" />
          <span className="window-dot max" />
          <span className="terminal-title">// INVESTIGATION OUTPUT</span>
        </div>
        <div className="terminal-body" ref={termBodyRef}>
          {lines.map((line, i) => (
            <div key={i} className="terminal-line">
              <span className="terminal-prompt">{'>'}</span>
              <span className={line.cls}>{line.text}</span>
            </div>
          ))}

          {scanning && (
            <div className="scan-progress">
              <div className="progress-label">PROCESSING...</div>
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
            </div>
          )}

          {!scanning && (
            <div className="terminal-line" style={{ marginTop: 4 }}>
              <span className="terminal-prompt">{'>'}</span>
              <span className="t-default">
                {done ? (
                  <span className="t-green"> SCAN COMPLETE</span>
                ) : (
                  ' '
                )}
                <span className="terminal-cursor" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
