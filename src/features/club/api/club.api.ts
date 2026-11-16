import { apiClient } from '@/lib/api/client';
import type { InformacionPublicaClub } from '../types';

export const clubApi = {
  /** TASK-60: planes, disciplinas y números del club. No requiere sesión. */
  async informacionPublica(): Promise<InformacionPublicaClub> {
    const { data } = await apiClient.get<InformacionPublicaClub>('/club/publico');
    return data;
  },
};
