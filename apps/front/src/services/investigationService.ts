import { api } from './api';
import type { Investigation, InvestigationStatus } from '../types/investigation';

export const investigationService = {
  async create(email: string): Promise<Investigation> {
    const { data } = await api.post<Investigation>('/investigations', { email });
    return data;
  },

  async findAll(status?: InvestigationStatus): Promise<Investigation[]> {
    const { data } = await api.get<Investigation[]>('/investigations', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async findOne(id: string): Promise<Investigation> {
    const { data } = await api.get<Investigation>(`/investigations/${id}`);
    return data;
  },

  async retry(id: string): Promise<Investigation> {
    const { data } = await api.post<Investigation>(`/investigations/${id}/retry`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/investigations/${id}`);
  },

  async removeAll(): Promise<void> {
    await api.delete('/investigations');
  },
};
