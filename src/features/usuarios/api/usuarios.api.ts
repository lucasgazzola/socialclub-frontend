import { apiClient } from '@/lib/api/client';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types';

export interface UsuariosQuery {
  incluirInactivos?: boolean;
}

export const usuariosApi = {
  async create(payload: CreateUsuarioDto): Promise<Usuario> {
    const { data } = await apiClient.post<Usuario>('/usuarios', payload);
    return data;
  },

  async list(query: UsuariosQuery = {}): Promise<Usuario[]> {
    const { data } = await apiClient.get<Usuario[]>('/usuarios', {
      params: query.incluirInactivos ? { incluirInactivos: true } : undefined,
    });
    return data;
  },

  async getById(id: number): Promise<Usuario> {
    const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`);
    return data;
  },

  async update(id: number, payload: UpdateUsuarioDto): Promise<Usuario> {
    const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, payload);
    return data;
  },

  async deactivate(id: number): Promise<Usuario> {
    const { data } = await apiClient.delete<Usuario>(`/usuarios/${id}`);
    return data;
  },
};

