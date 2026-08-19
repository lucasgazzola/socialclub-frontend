import { apiClient } from '@/lib/api/client';
import type { Evento, CrearEventoFormData } from '../types';

export const eventosApi = {
  async list(): Promise<Evento[]> {
    const { data } = await apiClient.get<Evento[]>('/eventos');
    return data;
  },

  async create(formData: CrearEventoFormData): Promise<Evento> {
    const { data } = await apiClient.post<Evento>('/eventos', formData);
    return data;
  },
};