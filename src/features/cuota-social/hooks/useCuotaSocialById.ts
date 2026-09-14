import { useQuery } from '@tanstack/react-query';
import { cuotaSocialApi } from '../api/cuota-social.api';
import { cuotaSocialKeys } from './cuota-social.keys';

export function useCuotaSocialById(id: number) {
  return useQuery({
    queryKey: [...cuotaSocialKeys.all, 'detail', id] as const,
    queryFn: () => cuotaSocialApi.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
