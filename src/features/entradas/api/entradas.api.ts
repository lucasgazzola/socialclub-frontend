import { apiClient } from '@/lib/api/client';
import type { CrearEntradasResult, Entrada, Evento } from '../types';

export const entradasApi = {
  async listarEventos(): Promise<Evento[]> {
    const { data } = await apiClient.get<Evento[]>('/eventos');
    return data;
  },

  async getEvento(id: number): Promise<Evento> {
    const { data } = await apiClient.get<Evento>(`/eventos/${id}`);
    return data;
  },

  async crearEntradas(eventoId: number, cantidad: number): Promise<CrearEntradasResult> {
    const { data } = await apiClient.post<CrearEntradasResult>('/entradas', {
      eventoId,
      cantidad,
    });
    return data;
  },

  async listarEntradasPorEvento(eventoId: number): Promise<Entrada[]> {
    const { data } = await apiClient.get<Entrada[]>(`/entradas/evento/${eventoId}`);
    return data;
  },
};