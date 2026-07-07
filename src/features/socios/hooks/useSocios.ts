import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sociosApi } from '../api/socios.api';
import type { SocioFormData, SociosQuery } from '../types';

/** Claves de cache de react-query para el módulo de socios. */
export const sociosKeys = {
  all: ['socios'] as const,
  list: (query: SociosQuery) => [...sociosKeys.all, 'list', query] as const,
  detail: (id: number) => [...sociosKeys.all, 'detail', id] as const,
};

export function useSocios(query: SociosQuery) {
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

<<<<<<< HEAD
<<<<<<< HEAD
export function useCrearSocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SocioFormData) => sociosApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sociosKeys.all }),
  });
}


=======
=======
>>>>>>> 0d96dd6 (feat[US-13]: editar socio)
export function useEditarSocio(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SocioFormData>) => sociosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sociosKeys.all }),
  });
}
<<<<<<< HEAD
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
=======
>>>>>>> 0d96dd6 (feat[US-13]: editar socio)
