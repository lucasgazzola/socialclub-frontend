import { useQuery } from '@tanstack/react-query';
import { cuotasApi } from '../api/fees.api';
import type { FeesQuery } from '../types';
import { cuotasKeys } from './fees.keys';

export function useFees(query: FeesQuery) {
  return useQuery({
    queryKey: cuotasKeys.list(query),
    queryFn: () => cuotasApi.list(query),
  });
}
