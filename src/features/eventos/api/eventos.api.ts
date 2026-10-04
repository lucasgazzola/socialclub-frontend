import { apiClient } from '@/lib/api/client';
import type { Evento, CrearEventoFormData, EventosPaginados } from '../types';

export interface FiltrarEventosParams {
  search?: string;
  soloDisponibles?: boolean;
  incluirBorradores?: boolean;
  ordenar?: 'nombre' | 'reciente' | 'fecha';
  pagina?: number;
  porPagina?: number;
}

export const eventosApi = {
  async list(params?: FiltrarEventosParams): Promise<EventosPaginados> {
    const { data } = await apiClient.get<EventosPaginados>('/eventos', {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.soloDisponibles ? { soloDisponibles: 'true' } : {}),
        ...(params?.incluirBorradores ? { incluirBorradores: 'true' } : {}),
        ...(params?.ordenar ? { ordenar: params.ordenar } : {}),
        ...(params?.pagina ? { pagina: params.pagina } : {}),
        ...(params?.porPagina ? { porPagina: params.porPagina } : {}),
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

  async update(id: number, formData: Partial<CrearEventoFormData>): Promise<Evento> {
    const { data } = await apiClient.patch<Evento>(`/eventos/${id}`, formData);
    return data;
  },
};
