import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export interface UseMisCuotasOptions {
  enabled?: boolean;
}

export function useMisCuotas(options?: UseMisCuotasOptions) {
  return useQuery({
    queryKey: pagosKeys.misCuotas(),
    queryFn: pagosApi.getMisCuotas,
    enabled: options?.enabled,
  });
}
