import { apiClient } from '@/lib/api/client';
import type { LoginPayload, RegisterPayload, UsuarioAutenticado } from '../types';

/**
 * Capa de acceso a la API del módulo de auth. Las features nunca llaman a
 * `apiClient` directamente: pasan por funciones como estas, lo que mantiene
 * los endpoints en un único lugar fácil de mantener.
 */
export const authApi = {
  async register(payload: RegisterPayload): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.post<{ usuario: UsuarioAutenticado }>(
      '/auth/register',
      payload,
    );
    return data.usuario;
  },

  async login(payload: LoginPayload): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.post<{ usuario: UsuarioAutenticado }>('/auth/login', payload);
    return data.usuario;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Re-firma la cookie del JWT con los roles actuales despues de hacerse SOCIO.
   */
  async refresh(): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.post<{ usuario: UsuarioAutenticado }>('/auth/refresh');
    return data.usuario;
  },

  async me(): Promise<UsuarioAutenticado> {
    const { data } = await apiClient.get<UsuarioAutenticado>('/auth/me');
    return data;
  },
};
