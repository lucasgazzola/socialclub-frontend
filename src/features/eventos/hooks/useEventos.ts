import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from '../api/eventos.api';
import type { FiltrarEventosParams } from '../api/eventos.api';

export const eventosKeys = {
  all: ['eventos'] as const,
  list: (params?: FiltrarEventosParams) => ['eventos', 'list', params] as const,
};

export function useEventos(params?: FiltrarEventosParams) {
  return useQuery({
    queryKey: eventosKeys.list(params),
    queryFn: () => eventosApi.list(params),
  });
}

export function useCrearEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosKeys.all });
    },
  });
}