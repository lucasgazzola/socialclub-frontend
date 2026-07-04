import { apiClient } from '@/lib/api/client';
import type { Usuario, CreateUsuarioDto } from '../types';

export const usuariosApi = {
  async create(payload: CreateUsuarioDto): Promise<Usuario> {
    const { data } = await apiClient.post<{ usuario: Usuario }>('/usuarios',payload,);
    return data.usuario;
  },

  async getById(id: number): Promise<Usuario> {
    const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`);
    return data;
  },
};

