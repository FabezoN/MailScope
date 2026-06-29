import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { authService } from './authService';
import { authStore } from '../store/authStore';
import { api } from './api';

vi.mock('./api', () => ({
  api: { post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('location', { href: '' });
  });

  it('login stocke le token et l\'utilisateur reçus', async () => {
    const response = { access_token: 'tok', user: { id: 'user-1', email: 'a@a.com', role: 'USER' as const } };
    (api.post as Mock).mockResolvedValue({ data: response });

    const result = await authService.login({ email: 'a@a.com', password: 'plain1234' });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@a.com', password: 'plain1234' });
    expect(authStore.getToken()).toBe('tok');
    expect(authStore.getUser()).toEqual(response.user);
    expect(result).toEqual(response);
  });

  it('register stocke le token et l\'utilisateur reçus', async () => {
    const response = { access_token: 'tok2', user: { id: 'user-2', email: 'b@b.com', role: 'USER' as const } };
    (api.post as Mock).mockResolvedValue({ data: response });

    await authService.register({ email: 'b@b.com', password: 'plain1234' });

    expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'b@b.com', password: 'plain1234' });
    expect(authStore.getToken()).toBe('tok2');
  });

  it('changePassword transmet l\'ancien et le nouveau mot de passe', async () => {
    (api.patch as Mock).mockResolvedValue({ data: undefined });

    await authService.changePassword('old-pw', 'new-password');

    expect(api.patch).toHaveBeenCalledWith('/auth/me/password', {
      currentPassword: 'old-pw',
      newPassword: 'new-password',
    });
  });

  it('deleteAccount supprime le compte côté serveur puis le token local', async () => {
    authStore.setToken('jwt-token');
    (api.delete as Mock).mockResolvedValue({ data: undefined });

    await authService.deleteAccount();

    expect(api.delete).toHaveBeenCalledWith('/auth/me');
    expect(authStore.getToken()).toBeNull();
  });

  it('logout supprime le token stocké', () => {
    authStore.setToken('jwt-token');

    authService.logout();

    expect(authStore.getToken()).toBeNull();
  });
});
