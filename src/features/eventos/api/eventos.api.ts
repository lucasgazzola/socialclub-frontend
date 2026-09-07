<<<<<<< HEAD
import { apiClient } from '@/lib/api/client';
import type { Evento, CrearEventoFormData } from '../types';

export interface FiltrarEventosParams {
  search?: string;
  soloDisponibles?: boolean;
  ordenar?: 'nombre' | 'reciente';
}

export const eventosApi = {
  async list(params?: FiltrarEventosParams): Promise<Evento[]> {
    const { data } = await apiClient.get<Evento[]>('/eventos', {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.soloDisponibles ? { soloDisponibles: 'true' } : {}),
        ...(params?.ordenar ? { ordenar: params.ordenar } : {}),
      },
    });
    return data;
  },

  async create(formData: CrearEventoFormData): Promise<Evento> {
    const { data } = await apiClient.post<Evento>('/eventos', formData);
    return data;
  },
};
=======
import { apiClient } from '@/lib/api/client';
import type { Evento, CrearEventoFormData } from '../types';

export const eventosApi = {
  async list(params?: FiltrarEventosParams): Promise<Evento[]> {
    const { data } = await apiClient.get<Evento[]>('/eventos', {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.soloDisponibles ? { soloDisponibles: 'true' } : {}),
        ...(params?.ordenar ? { ordenar: params.ordenar } : {}),
      },
    });
    return data;
  },

  async getById(id: number): Promise<Evento> {
    const { data } = await apiClient.get<Evento>(`/eventos/${id}`);
    return data;
  },

  async create(formData: CrearEventoFormData): Promise<Evento> {
    const { data } = await apiClient.post<Evento>('/eventos', formData);
    return data;
  },
};
>>>>>>> 5800e88ce415ff9b63bece2afbf07857a88b3cc2
