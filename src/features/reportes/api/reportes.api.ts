import { apiClient } from '@/lib/api/client';
import type {
  EstadoFinanciero,
  FiltrosEstadoFinanciero,
  ReporteAsistenciaEventos,
  FiltrosAsistenciaEventos,
} from '../types';

export const reportesApi = {
  /** US-35 — Estado financiero de un rango de meses. */
  async getEstadoFinanciero(filtros: FiltrosEstadoFinanciero): Promise<EstadoFinanciero> {
    const { data } = await apiClient.get<EstadoFinanciero>('/reportes/estado-financiero', {
      params: filtros,
    });
    return data;
  },

  /** US-36 — Reporte de asistencia y ocupación de eventos. */
  async getAsistenciaEventos(
    filtros?: FiltrosAsistenciaEventos,
  ): Promise<ReporteAsistenciaEventos> {
    const { data } = await apiClient.get<ReporteAsistenciaEventos>(
      '/reportes/asistencia-eventos',
      {
        params: filtros,
      },
    );
    return data;
  },
};
