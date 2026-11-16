import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { HistorialDeportivoFiltro } from '../types';

/**
 * US-22 — Historial de cuotas deportivas de un participante (pagos + adeudados),
 * con filtro opcional por rango de fechas. Solo lectura.
 */
export function useHistorialDeportivo(
  personaId?: number | null,
  filtro: HistorialDeportivoFiltro = {},
) {
  return useQuery({
    queryKey: pagosKeys.historialDeportivo(personaId!, filtro.desde, filtro.hasta),
    queryFn: () => pagosApi.getHistorialDeportivo(personaId!, filtro),
    enabled: typeof personaId === 'number' && personaId > 0,
  });
}
