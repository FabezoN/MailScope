import { Outlet } from 'react-router-dom';
import MatrixRain from '../MatrixRain';
import '../../styles/auth.css';

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const AuthLayout = () => {
  return (
    <div className="auth-wrapper">
      <MatrixRain />
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <SearchIcon />
          </span>
          <h1>MailScope</h1>
          <p>Plateforme d'investigation email OSINT</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
