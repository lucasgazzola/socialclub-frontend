import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export function useHistorialPagos() {
  return useQuery({
    queryKey: pagosKeys.historial(),
    queryFn: pagosApi.getHistorial,
  });
}
