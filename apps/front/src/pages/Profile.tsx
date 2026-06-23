import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authStore } from '../store/authStore';
import { authService } from '../services/authService';
import { investigationService } from '../services/investigationService';

function apiErrorMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string | string[] } } })
      ?.response?.data?.message
      ?.toString() ??
    (err as Error)?.message ??
    'Une erreur est survenue.'
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-title">{title}</span>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const user = authStore.getUser();
  const queryClient = useQueryClient();

  /* Change password */
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [pwdError, setPwdError]       = useState('');
  const [pwdSuccess, setPwdSuccess]   = useState(false);

  const changePwdMutation = useMutation({
    mutationFn: () => authService.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      setPwdSuccess(true);
      setPwdError('');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setPwdSuccess(false), 3000);
    },
    onError: (err) => { setPwdError(apiErrorMessage(err)); },
  });

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd !== confirmPwd) { setPwdError('Les nouveaux mots de passe ne correspondent pas.'); return; }
    if (newPwd.length < 8)    { setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    changePwdMutation.mutate();
  };

  /* Delete all investigations */
  const deleteAllMutation = useMutation({
    mutationFn: () => investigationService.removeAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investigations'] }),
  });

  /* Delete account */
  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">PROFILE</h1>
        <p className="page-subtitle">{user?.email ?? '—'}</p>
      </div>

      <SectionCard title="OPERATOR INFO">
        <div className="profile-info-grid">
          <div className="profile-info-row">
            <span className="profile-info-label">EMAIL</span>
            <span className="profile-info-value">{user?.email ?? '—'}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">ROLE</span>
            <span className="profile-info-value">
              <span className="profile-role-badge">{user?.role ?? 'USER'}</span>
            </span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">ID</span>
            <span className="profile-info-value profile-info-mono">{user?.id ?? '—'}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="CHANGE PASSWORD">
        <form className="profile-form" onSubmit={handleChangePwd}>
          <div className="profile-field">
            <label className="profile-label">CURRENT PASSWORD</label>
            <input
              className="profile-input"
              type="password"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="profile-field">
            <label className="profile-label">NEW PASSWORD</label>
            <input
              className="profile-input"
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="profile-field">
            <label className="profile-label">CONFIRM NEW PASSWORD</label>
            <input
              className="profile-input"
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {pwdError   && <div className="profile-msg error">{pwdError}</div>}
          {pwdSuccess && <div className="profile-msg success">PASSWORD UPDATED SUCCESSFULLY.</div>}
          <button
            type="submit"
            className="profile-submit-btn"
            disabled={changePwdMutation.isPending}
          >
            {changePwdMutation.isPending ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="DANGER ZONE">
        <div className="danger-zone">
          <div className="danger-item">
            <div>
              <div className="danger-item-title">Delete all investigations</div>
              <div className="danger-item-desc">Supprime définitivement toutes vos investigations et leurs rapports.</div>
            </div>
            <button
              className="danger-btn"
              onClick={() => {
                if (window.confirm('Supprimer toutes vos investigations ? Cette action est irréversible.'))
                  deleteAllMutation.mutate();
              }}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? 'DELETING...' : 'DELETE ALL'}
            </button>
          </div>

          {deleteAllMutation.isSuccess && (
            <div className="profile-msg success" style={{ marginTop: 0 }}>
              Toutes les investigations ont été supprimées.
            </div>
          )}

          <div className="danger-separator" />

          <div className="danger-item">
            <div>
              <div className="danger-item-title">Delete account</div>
              <div className="danger-item-desc">Supprime définitivement votre compte. Vous serez déconnecté immédiatement.</div>
            </div>
            <button
              className="danger-btn critical"
              onClick={() => {
                if (window.confirm('Supprimer votre compte ? Cette action est irréversible.'))
                  deleteAccountMutation.mutate();
              }}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? 'DELETING...' : 'DELETE ACCOUNT'}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
