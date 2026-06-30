import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { authStore } from '../../store/authStore';
import '../../styles/app.css';

const ScanIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AppLayout = () => {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const user = authStore.getUser();
  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink to="/dashboard" className="navbar-logo">
          <span className="navbar-logo-icon">
            <ScanIcon />
          </span>
          <span className="navbar-logo-name">MAILSCOPE</span>
        </NavLink>

        <nav className="navbar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/investigations"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          >
            Investigations
          </NavLink>
        </nav>

        <div className="navbar-right" ref={dropRef}>
          <button className="profile-btn" onClick={() => setOpen(o => !o)}>
            <span className="profile-avatar">{initials}</span>
            <span className={`profile-chevron${open ? ' open' : ''}`}>
              <ChevronIcon />
            </span>
          </button>

          {open && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-label">OPERATOR</div>
                <div className="profile-dropdown-email">{user?.email ?? '—'}</div>
                <div className="profile-dropdown-role">
                  {user?.role ?? 'USER'}
                </div>
              </div>
              <div className="profile-dropdown-actions">
                <Link
                  to="/profile"
                  className="dropdown-nav-btn"
                  onClick={() => setOpen(false)}
                >
                  <UserIcon />
                  Profile
                </Link>
                <button className="logout-btn" onClick={() => authService.logout()}>
                  <LogoutIcon />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
