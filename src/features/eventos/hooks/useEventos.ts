import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from '../api/eventos.api';

export const eventosKeys = {
  all: ['eventos'] as const,
};

export function useEventos() {
  return useQuery({
    queryKey: eventosKeys.all,
    queryFn: () => eventosApi.list(),
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