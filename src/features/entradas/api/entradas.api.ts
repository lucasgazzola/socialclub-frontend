import { apiClient } from '@/lib/api/client';
import type {
  ComprarEntradasPayload,
  CrearEntradasResult,
  Entrada,
  ValidarAccesoResponse,
} from '../types';
import type { OrdenPago } from '@/features/pasarela/types';

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

  /** US-52 · TASK-51: reserva el cupo y devuelve la orden con la URL de la pasarela. */
  async iniciarCompra(payload: ComprarEntradasPayload): Promise<OrdenPago> {
    const { data } = await apiClient.post<OrdenPago>('/entradas/checkout', payload);
    return data;
  },

  async listarMisEntradas(): Promise<Entrada[]> {
    const { data } = await apiClient.get<Entrada[]>('/entradas/mis-entradas');
    return data;
  },
};