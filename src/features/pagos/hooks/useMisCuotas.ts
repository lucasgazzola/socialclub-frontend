import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export function useMisCuotas() {
  return useQuery({
    queryKey: pagosKeys.misCuotas(),
    queryFn: pagosApi.getMisCuotas,
  });
}
