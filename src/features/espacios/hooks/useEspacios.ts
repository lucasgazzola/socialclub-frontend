import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { espaciosApi } from '../api/espacios.api';
import type { CreateBloqueoPayload, CreateEspacioPayload, FindEspaciosQuery } from '../types';

export const ESPACIOS_QUERY_KEY = ['espacios'] as const;

export function useEspacios(query?: FindEspaciosQuery) {
  return useQuery({
    queryKey: [...ESPACIOS_QUERY_KEY, query ?? {}],
    queryFn: () => espaciosApi.list(query),
  });
}

export function useEspacio(id: number | null) {
  return useQuery({
    queryKey: [...ESPACIOS_QUERY_KEY, 'detalle', id],
    queryFn: () => espaciosApi.getById(id as number),
    enabled: Boolean(id && id > 0),
  });
}

export function useCrearEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEspacioPayload) => espaciosApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      toast.success('Espacio físico creado correctamente');
    },
  });
}

export function useAgregarBloqueo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ espacioId, payload }: { espacioId: number; payload: CreateBloqueoPayload }) =>
      espaciosApi.agregarBloqueo(espacioId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...ESPACIOS_QUERY_KEY, 'detalle', variables.espacioId],
      });
      toast.success('Bloqueo de agenda registrado correctamente');
    },
  });
}
