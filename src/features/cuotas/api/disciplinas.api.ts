import { apiClient } from '@/lib/api/client';
import type { Disciplina } from '../types';
import type { DisciplinasPaginadas } from '@/features/disciplinas/types';

export const disciplinasApi = {
  async list(): Promise<Disciplina[]> {
    const { data } = await apiClient.get<DisciplinasPaginadas>('/disciplinas', { params: { pagina: 1, porPagina: 100 } });
    return data.items as unknown as Disciplina[];
  },
};
