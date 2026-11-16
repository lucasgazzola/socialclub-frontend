import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes.api';
import type { EstadoFinanciero, FiltrosEstadoFinanciero } from '../types';

export const reportesKeys = {
  all: ['reportes'] as const,
  estadoFinanciero: (filtros: FiltrosEstadoFinanciero) =>
    [...reportesKeys.all, 'estado-financiero', filtros] as const,
};

/** US-35 — Estado financiero; no consulta si el rango es inválido. */
export function useEstadoFinanciero(filtros: FiltrosEstadoFinanciero, habilitado = true) {
  return useQuery<EstadoFinanciero>({
    queryKey: reportesKeys.estadoFinanciero(filtros),
    queryFn: () => reportesApi.getEstadoFinanciero(filtros),
    enabled: habilitado,
    staleTime: 1000 * 30,
  });
}
