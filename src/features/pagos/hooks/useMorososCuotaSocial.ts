import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { FiltrosMorososCuotaSocial, MorososCuotaSocialResponse } from '../types';

export function useMorososCuotaSocial(filtros: FiltrosMorososCuotaSocial = {}) {
  return useQuery<MorososCuotaSocialResponse>({
    queryKey: pagosKeys.morososCuotaSocial(filtros),
    queryFn: () => pagosApi.getMorososCuotaSocial(filtros),
    staleTime: 1000 * 30, // 30 segundos
  });
}

