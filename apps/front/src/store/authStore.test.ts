import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retourne null et false quand rien n\'est stocké', () => {
    expect(authStore.getToken()).toBeNull();
    expect(authStore.getUser()).toBeNull();
    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('stocke et relit le token', () => {
    authStore.setToken('jwt-token');

    expect(authStore.getToken()).toBe('jwt-token');
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('stocke et relit l\'utilisateur', () => {
    const user = { id: 'user-1', email: 'a@a.com', role: 'USER' as const };
    authStore.setUser(user);

    expect(authStore.getUser()).toEqual(user);
  });

  it('retourne null si le JSON utilisateur stocké est corrompu', () => {
    localStorage.setItem('ms_user', 'not-json');

    expect(authStore.getUser()).toBeNull();
  });

  it('removeToken supprime à la fois le token et l\'utilisateur', () => {
    authStore.setToken('jwt-token');
    authStore.setUser({ id: 'user-1', email: 'a@a.com', role: 'USER' });

    authStore.removeToken();

    expect(authStore.getToken()).toBeNull();
    expect(authStore.getUser()).toBeNull();
    expect(authStore.isAuthenticated()).toBe(false);
  });
});
