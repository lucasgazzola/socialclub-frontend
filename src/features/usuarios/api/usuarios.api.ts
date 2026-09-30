import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, GetUsuariosParams } from '../types';

export const usuariosApi = {
  async create(payload: CreateUsuarioDto): Promise<Usuario> {
    const { data } = await apiClient.post<Usuario>('/usuarios', payload);
    return data;
  },

  async list(params?: GetUsuariosParams): Promise<Paginated<Usuario>> {
    const { data } = await apiClient.get<Paginated<Usuario>>('/usuarios', {
      params: {
        busqueda: params?.busqueda?.trim() || undefined,
        rolId: params?.rolId || undefined,
        estado: params?.estado && params.estado !== 'todos' ? params.estado : undefined,
        pagina: params?.pagina,
        porPagina: params?.porPagina,
      },
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

  async activate(id: number): Promise<Usuario> {
    const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}/activar`);
    return data;
  },
};
