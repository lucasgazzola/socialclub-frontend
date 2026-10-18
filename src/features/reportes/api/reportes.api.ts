import { apiClient } from '@/lib/api/client';
import type { EstadoFinanciero, FiltrosEstadoFinanciero } from '../types';

export const reportesApi = {
  /** US-35 — Estado financiero de un rango de meses. */
  async getEstadoFinanciero(filtros: FiltrosEstadoFinanciero): Promise<EstadoFinanciero> {
    const { data } = await apiClient.get<EstadoFinanciero>('/reportes/estado-financiero', {
      params: filtros,
    });
    return data;
  },
};
