import { apiClient } from '@/lib/api/client';
import type {
  CreateDisciplinaPayload,
  Disciplina,
  DisciplinaOption,
  UpdateDisciplinaPayload,
  DisciplinasPaginadas,
  DisciplinasQuery,
} from '../types';

/**
 * Lista las disciplinas activas del club para el selector de inscripción.
 * El backend devuelve todas; acá se filtran solo las activas.
 */
export async function listarDisciplinasActivas(): Promise<DisciplinaOption[]> {
  const { data } = await apiClient.get<DisciplinasPaginadas>('/disciplinas', { params: { estado: 'ACTIVA', pagina: 1, porPagina: 100 } });
  return data.items as unknown as DisciplinaOption[];
}

export async function listarDisciplinas(query: DisciplinasQuery): Promise<DisciplinasPaginadas> {
  const { data } = await apiClient.get<DisciplinasPaginadas>('/disciplinas', { params: query });
  return data;
}

export async function obtenerDisciplina(id: number): Promise<Disciplina> {
  const { data } = await apiClient.get<Disciplina>(`/disciplinas/${id}`);
  return data;
}

export async function crearDisciplina(payload: CreateDisciplinaPayload): Promise<Disciplina> {
  const { data } = await apiClient.post<Disciplina>('/disciplinas', payload);
  return data;
}

export async function actualizarDisciplina(
  id: number,
  payload: UpdateDisciplinaPayload,
): Promise<Disciplina> {
  const { data } = await apiClient.patch<Disciplina>(`/disciplinas/${id}`, payload);
  return data;
}

export async function desactivarDisciplina(id: number): Promise<Disciplina> {
  const { data } = await apiClient.delete<Disciplina>(`/disciplinas/${id}`);
  return data;
}

export async function reactivarDisciplina(id: number): Promise<Disciplina> {
  const { data } = await apiClient.patch<Disciplina>(`/disciplinas/${id}/reactivar`);
  return data;
}
