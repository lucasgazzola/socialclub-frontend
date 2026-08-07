import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria.api';
import type { AuditoriaQuery } from '../types';

export const auditoriaKeys = {
  all: ['auditoria'] as const,
  list: (query: AuditoriaQuery) => [...auditoriaKeys.all, 'list', query] as const,
};

export function useAuditoria(query: AuditoriaQuery) {
  return useQuery({
    queryKey: auditoriaKeys.list(query),
    queryFn: () => auditoriaApi.list(query),
  });
}