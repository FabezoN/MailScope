import { api } from './api';

export interface ServiceHealth {
  status: 'up' | 'down';
}

export interface HealthResponse {
  status: 'ok' | 'error';
  details: Record<string, ServiceHealth>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const { data } = await api.get<HealthResponse>('/health', {
      validateStatus: (s) => s === 200 || s === 503,
    });
    return data;
  } catch {
    return { status: 'error', details: {} };
  }
}
