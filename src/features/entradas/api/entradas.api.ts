import { apiClient } from '@/lib/api/client';
import type {
  ComprarEntradasPayload,
  CompraEntradasResult,
  CrearEntradasResult,
  Entrada,
  ValidarAccesoResponse,
} from '../types';

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

  async comprarEntradas(payload: ComprarEntradasPayload): Promise<CompraEntradasResult> {
    const { data } = await apiClient.post<CompraEntradasResult>('/entradas/comprar', payload);
    return data;
  },

  async listarMisEntradas(): Promise<Entrada[]> {
    const { data } = await apiClient.get<Entrada[]>('/entradas/mis-entradas');
    return data;
  },
};