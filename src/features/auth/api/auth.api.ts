import { apiClient } from '@/lib/api/client';
import type { LoginPayload, UsuarioAutenticado } from '../types';

/**
 * Capa de acceso a la API del módulo de auth. Las features nunca llaman a
 * `apiClient` directamente: pasan por funciones como estas, lo que mantiene
 * los endpoints en un único lugar fácil de mantener.
 */
export const authApi = {
  async login(payload: LoginPayload): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.post<{ usuario: UsuarioAutenticado }>('/auth/login', payload);
    return data.usuario;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.get<UsuarioAutenticado>('/auth/me');
    return data;
  },
};
