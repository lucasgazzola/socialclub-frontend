import { apiClient } from '@/lib/api/client';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

export interface UsersQuery {
  incluirInactivos?: boolean;
}

export const usuariosApi = {
  async create(payload: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  async list(query: UsersQuery = {}): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users', {
      params: query.incluirInactivos ? { incluirInactivos: true } : undefined,
    });
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  async update(id: number, payload: UpdateUserDto): Promise<User> {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async deactivate(id: number): Promise<User> {
    const { data } = await apiClient.delete<User>(`/users/${id}`);
    return data;
  },
};

