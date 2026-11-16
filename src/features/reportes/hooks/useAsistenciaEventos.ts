import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes.api';
import type { FiltrosAsistenciaEventos } from '../types';

/** US-36 — Hook para consultar el reporte de asistencia a eventos. */
export function useAsistenciaEventos(filtros?: FiltrosAsistenciaEventos) {
  return useQuery({
    queryKey: ['reportes', 'asistencia-eventos', filtros],
    queryFn: () => reportesApi.getAsistenciaEventos(filtros),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
