import { apiClient } from '@/lib/api/client';
import type {
  CategoriaDisciplinaDetalle,
  CategoriaPayload,
  CategoriasDeDisciplina,
  CategoriasQuery,
} from '../types';

/** US-48 a US-51: categorías anidadas bajo su disciplina. */
const base = (disciplinaId: number) => `/disciplinas/${disciplinaId}/categorias`;

export async function listarCategorias(
  disciplinaId: number,
  query: CategoriasQuery,
): Promise<CategoriasDeDisciplina> {
  const { data } = await apiClient.get<CategoriasDeDisciplina>(base(disciplinaId), { params: query });
  return data;
}

export async function crearCategoria(
  disciplinaId: number,
  payload: CategoriaPayload,
): Promise<CategoriaDisciplinaDetalle> {
  const { data } = await apiClient.post<CategoriaDisciplinaDetalle>(base(disciplinaId), payload);
  return data;
}

export async function actualizarCategoria(
  disciplinaId: number,
  id: number,
  payload: Partial<CategoriaPayload>,
): Promise<CategoriaDisciplinaDetalle> {
  const { data } = await apiClient.patch<CategoriaDisciplinaDetalle>(`${base(disciplinaId)}/${id}`, payload);
  return data;
}

export async function desactivarCategoria(disciplinaId: number, id: number): Promise<CategoriaDisciplinaDetalle> {
  const { data } = await apiClient.delete<CategoriaDisciplinaDetalle>(`${base(disciplinaId)}/${id}`);
  return data;
}

export async function reactivarCategoria(disciplinaId: number, id: number): Promise<CategoriaDisciplinaDetalle> {
  const { data } = await apiClient.patch<CategoriaDisciplinaDetalle>(`${base(disciplinaId)}/${id}/reactivar`);
  return data;
}
