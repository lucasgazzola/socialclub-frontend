import { apiClient } from '@/lib/api/client';
import type { LoginPayload, RegisterPayload, AuthenticatedUser } from '../types';

/**
 * Capa de acceso a la API del módulo de auth. Las features nunca llaman a
 * `apiClient` directamente: pasan por funciones como estas, lo que mantiene
 * los endpoints en un único lugar fácil de mantener.
 */
export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthenticatedUser> {
    const { data } = await apiClient.post<{ user: AuthenticatedUser }>(
      '/auth/register',
      payload,
    );
    return data.user;
  },

  async login(payload: LoginPayload): Promise<AuthenticatedUser> {
    const { data } = await apiClient.post<{ user: AuthenticatedUser }>('/auth/login', payload);
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<AuthenticatedUser> {
    const { data } = await apiClient.get<AuthenticatedUser>('/auth/me');
    return data;
  },
};
