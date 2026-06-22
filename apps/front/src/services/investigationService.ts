import { api } from './api';
import type { Investigation } from '../types/investigation';

export const investigationService = {
  async create(email: string): Promise<Investigation> {
    const { data } = await api.post<Investigation>('/investigations', { email });
    return data;
  },

  async findAll(): Promise<Investigation[]> {
    const { data } = await api.get<Investigation[]>('/investigations');
    return data;
  },

  async findOne(id: string): Promise<Investigation> {
    const { data } = await api.get<Investigation>(`/investigations/${id}`);
    return data;
  },
};
