import { api } from './api';
import { authStore } from '../store/authStore';
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    authStore.setToken(data.access_token);
    authStore.setUser(data.user);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    authStore.setToken(data.access_token);
    authStore.setUser(data.user);
    return data;
  },

  logout(): void {
    authStore.removeToken();
    window.location.href = '/login';
  },
};
