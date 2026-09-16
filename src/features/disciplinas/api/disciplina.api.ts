import { apiClient } from '@/lib/api/client';
import type { DisciplinaOption } from '../types';

/**
 * Lista las disciplinas activas del club para el selector de inscripción.
 * El backend devuelve todas; acá se filtran solo las activas.
 */
export async function listarDisciplinasActivas(): Promise<DisciplinaOption[]> {
  const { data } = await apiClient.get<DisciplinaOption[]>('/disciplinas');
  return data.filter((d) => d.activo);
}
