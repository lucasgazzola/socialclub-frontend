import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export function useCuotasPendientesSocio(socioId?: number | null) {
  return useQuery({
    queryKey: pagosKeys.cuotasPendientesSocio(socioId!),
    queryFn: () => pagosApi.getCuotasPendientesSocio(socioId!),
    enabled: typeof socioId === 'number' && socioId > 0,
  });
}
