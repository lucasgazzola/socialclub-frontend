import { apiClient } from '@/lib/api/client';
import type { Discipline } from '../types';

export const disciplinasApi = {
  async list(): Promise<Discipline[]> {
    const { data } = await apiClient.get<Discipline[]>('/disciplines');
    return data;
  },
};
