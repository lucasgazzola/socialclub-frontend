import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventosApi } from '../api/eventos.api';
import type { FiltrarEventosParams } from '../api/eventos.api';

export const eventosKeys = {
  all: ['eventos'] as const,
  list: (params?: FiltrarEventosParams) => ['eventos', 'list', params] as const,
  byId: (id: number) => ['eventos', id] as const,
};

export function useEventos(params?: FiltrarEventosParams) {
  return useQuery({
    queryKey: eventosKeys.list(params),
    queryFn: () => eventosApi.list(params),
  });
}

export function useEvento(id: number) {
  return useQuery({
    queryKey: eventosKeys.byId(id),
    queryFn: () => eventosApi.getById(id),
    enabled: !!id,
  });
}

export function useCrearEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventosKeys.all });
      toast.success('Evento creado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear el evento');
    },
  });
}
