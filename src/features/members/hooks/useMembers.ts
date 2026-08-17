import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sociosApi } from '../api/members.api';
import type { MemberFormData, MembersQuery } from '../types';

/** Claves de cache de react-query para el módulo de socios. */
export const sociosKeys = {
  all: ['socios'] as const,
  list: (query: MembersQuery) => [...sociosKeys.all, 'list', query] as const,
  detail: (id: number) => [...sociosKeys.all, 'detail', id] as const,
};

export function useMembers(query: MembersQuery) {
  return useQuery({
    queryKey: sociosKeys.list(query),
    queryFn: () => sociosApi.list(query),
  });
}

export function useSocio(id: number) {
  return useQuery({
    queryKey: sociosKeys.detail(id),
    queryFn: () => sociosApi.getById(id),
    enabled: !!id,
  });
}

export function useCrearSocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MemberFormData) => sociosApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sociosKeys.all }),
  });
}

export function useEditarSocio(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MemberFormData>) => sociosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sociosKeys.all }),
  });
}
