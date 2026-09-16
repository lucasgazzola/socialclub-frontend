import { apiClient } from '@/lib/api/client';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types';

export const usuariosApi = {
  async create(payload: CreateUsuarioDto): Promise<Usuario> {
    const { data } = await apiClient.post<Usuario>('/usuarios', payload);
    return data;
  },

  // El backend devuelve activos e inactivos en una sola respuesta; el filtro
  // por estado se aplica en la pantalla.
  async list(): Promise<Usuario[]> {
    const { data } = await apiClient.get<Usuario[]>('/usuarios');
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
