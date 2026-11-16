import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { espaciosApi } from '../api/espacios.api';
import type {
  CreateBloqueoPayload,
  CreateEspacioPayload,
  FindEspaciosQuery,
  UpdateBloqueoPayload,
  UpdateEspacioPayload,
} from '../types';

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

export function useActualizarEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEspacioPayload }) =>
      espaciosApi.update(id, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...ESPACIOS_QUERY_KEY, 'detalle', variables.id],
      });
      toast.success('Espacio físico actualizado correctamente');
    },
  });
}

export function useEliminarEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => espaciosApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      toast.success('Espacio físico dado de baja correctamente');
    },
  });
}

export function useReactivarEspacio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => espaciosApi.reactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      toast.success('Espacio físico reactivado correctamente');
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

export function useActualizarBloqueo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      espacioId,
      bloqueoId,
      payload,
    }: {
      espacioId: number;
      bloqueoId: number;
      payload: UpdateBloqueoPayload;
    }) => espaciosApi.updateBloqueo(espacioId, bloqueoId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...ESPACIOS_QUERY_KEY, 'detalle', variables.espacioId],
      });
      toast.success('Bloqueo de agenda actualizado correctamente');
    },
  });
}

export function useEliminarBloqueo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ espacioId, bloqueoId }: { espacioId: number; bloqueoId: number }) =>
      espaciosApi.deleteBloqueo(espacioId, bloqueoId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ESPACIOS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...ESPACIOS_QUERY_KEY, 'detalle', variables.espacioId],
      });
      toast.success('Bloqueo de agenda eliminado correctamente');
    },
  });
}
