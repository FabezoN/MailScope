import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { authStore } from '../store/authStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Page de connexion</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Tableau de bord</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  it('redirige vers /login si l\'utilisateur n\'est pas authentifié', () => {
    renderWithRouter();

    expect(screen.getByText('Page de connexion')).toBeInTheDocument();
  });

  it('affiche la route protégée si l\'utilisateur est authentifié', () => {
    authStore.setToken('jwt-token');

    renderWithRouter();

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });
});
