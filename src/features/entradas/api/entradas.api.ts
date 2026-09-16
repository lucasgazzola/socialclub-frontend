import { apiClient } from '@/lib/api/client';
import type { CrearEntradasResult, Entrada, ValidarAccesoResponse } from '../types';

export const entradasApi = {
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

  async validarEntrada(token: string): Promise<ValidarAccesoResponse> {
    const { data } = await apiClient.post<ValidarAccesoResponse>('/entradas/validar', {
      token,
    });
    return data;
  },
};