import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export function useMiHistorialDeportivo(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...pagosKeys.all, 'mi-historial-deportivo'] as const,
    queryFn: () => pagosApi.getMiHistorialDeportivo(),
    enabled: options?.enabled,
    refetchOnMount: 'always',
  });
}
