import axios from 'axios';
import { authStore } from '../store/authStore';

const baseURL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/v1`;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
