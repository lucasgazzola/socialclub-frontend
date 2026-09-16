import { useQuery } from '@tanstack/react-query';
import { cuotaSocialApi } from '../api/cuota-social.api';
import type { CuotaSocialQuery } from '../types';
import { cuotaSocialKeys } from './cuota-social.keys';

export function useCuotaSocial(query: CuotaSocialQuery) {
  return useQuery({
    queryKey: cuotaSocialKeys.list(query),
    queryFn: () => cuotaSocialApi.list(query),
  });
}
