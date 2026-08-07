import { apiClient } from '@/lib/api/client';
import type { Disciplina } from '../types';

export const disciplinasApi = {
  async list(): Promise<Disciplina[]> {
    const { data } = await apiClient.get<Disciplina[]>('/disciplinas');
    return data;
  },
};
