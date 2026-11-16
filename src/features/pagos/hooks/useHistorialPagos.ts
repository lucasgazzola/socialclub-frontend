import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export interface UseHistorialPagosOptions {
  enabled?: boolean;
}

export function useHistorialPagos(options?: UseHistorialPagosOptions) {
  return useQuery({
    queryKey: pagosKeys.historial(),
    queryFn: pagosApi.getHistorial,
    enabled: options?.enabled,
  });
}
