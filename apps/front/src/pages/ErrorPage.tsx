import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  let status: number | undefined;
  let detail = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    status = error.status;
    detail = error.statusText || detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const is404 = status === 404;

  return (
    <div className="error-page">
      <div className="error-terminal">
        <div className="terminal-header">
          <span className="window-dot close" />
          <span className="window-dot min" />
          <span className="window-dot max" />
          <span className="terminal-title">// {is404 ? '404 NOT FOUND' : 'RUNTIME ERROR'}</span>
        </div>
        <div className="terminal-body">
          <div className="terminal-line">
            <span className="terminal-prompt">{'>'}</span>
            <span className="t-red">
              SYSTEM ERROR{status ? ` — ${status}` : ''}
            </span>
          </div>
          <div className="terminal-line">
            <span className="terminal-prompt">{'>'}</span>
            <span className="t-dim">
              {is404 ? 'ROUTE NOT FOUND — THIS PATH DOES NOT EXIST' : detail.toUpperCase()}
            </span>
          </div>
          <div className="terminal-line terminal-action-line">
            <span className="terminal-prompt">{'>'}</span>
            <Link to="/dashboard" className="terminal-report-link">
              RETURN TO DASHBOARD →
            </Link>
          </div>
          <div className="terminal-line" style={{ marginTop: 4 }}>
            <span className="terminal-prompt">{'>'}</span>
            <span className="t-default"> <span className="terminal-cursor" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
