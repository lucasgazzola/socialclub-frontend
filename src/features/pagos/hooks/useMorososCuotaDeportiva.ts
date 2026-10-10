import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { FiltrosMorososCuotaDeportiva, MorososCuotaDeportivaResponse } from '../types';

/** US-23 — Morosos de cuota deportiva (cuotas vencidas e impagas). */
export function useMorososCuotaDeportiva(filtros: FiltrosMorososCuotaDeportiva = {}) {
  return useQuery<MorososCuotaDeportivaResponse>({
    queryKey: pagosKeys.morososCuotaDeportiva(filtros),
    queryFn: () => pagosApi.getMorososCuotaDeportiva(filtros),
    staleTime: 1000 * 30,
  });
}
