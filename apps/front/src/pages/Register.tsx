import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authService.register({ email, password }),
    onSuccess: () => navigate('/dashboard'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirm) {
      setLocalError('Les mots de passe ne correspondent pas.');
      return;
    }

    mutation.mutate();
  };

  const errorMessage =
    localError ||
    (mutation.isError ? 'Cet email est déjà utilisé ou une erreur est survenue.' : '');

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-header">
        <h2>Créer un compte</h2>
        <p>Commencez à investiguer des emails</p>
      </div>

      {errorMessage && (
        <div className="auth-error">{errorMessage}</div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caractères minimum"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm">Confirmer le mot de passe</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Création…' : 'Créer mon compte'}
      </button>

      <hr className="auth-divider" />

      <p className="auth-footer">
        Déjà un compte ?{' '}
        <Link to="/login">Se connecter</Link>
      </p>
    </form>
  );
};

export default RegisterPage;
