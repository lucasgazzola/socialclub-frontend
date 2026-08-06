import { useQuery } from '@tanstack/react-query';
import { cuotasApi } from '../api/cuotas.api';
import type { CuotasQuery } from '../types';
import { cuotasKeys } from './cuotas.keys';

export function useCuotas(query: CuotasQuery) {
  return useQuery({
    queryKey: cuotasKeys.list(query),
    queryFn: () => cuotasApi.list(query),
  });
}
