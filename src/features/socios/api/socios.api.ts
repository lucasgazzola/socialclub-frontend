import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { Socio, SociosQuery } from '../types';

export const sociosApi = {
  async list(query: SociosQuery = {}): Promise<Paginated<Socio>> {
    const { data } = await apiClient.get<Paginated<Socio>>('/socios', { params: query });
    return data;
  },

  async getById(id: number): Promise<Socio> {
    const { data } = await apiClient.get<Socio>(`/socios/${id}`);
    return data;
  },
};
