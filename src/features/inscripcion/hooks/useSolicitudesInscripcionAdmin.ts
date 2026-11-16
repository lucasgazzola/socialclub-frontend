import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aprobarSolicitudInscripcion,
  listarSolicitudesInscripcion,
  rechazarSolicitudInscripcion,
} from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';
import type {
  AprobarSolicitudInscripcionResultado,
  SolicitudesInscripcionQuery,
  SolicitudInscripcion,
  SolicitudInscripcionAdmin,
} from '../types';

export const solicitudesInscripcionAdminKeys = {
  all: ['inscripciones', 'solicitudes-admin'] as const,
  list: (query: SolicitudesInscripcionQuery) =>
    [...solicitudesInscripcionAdminKeys.all, query] as const,
};

export function useSolicitudesInscripcionAdmin(query: SolicitudesInscripcionQuery = {}) {
  return useQuery<SolicitudInscripcionAdmin[], Error>({
    queryKey: solicitudesInscripcionAdminKeys.list(query),
    queryFn: () => listarSolicitudesInscripcion(query),
  });
}

export function useAprobarSolicitudInscripcion() {
  const queryClient = useQueryClient();
  return useMutation<AprobarSolicitudInscripcionResultado, Error, number>({
    mutationFn: (id) => aprobarSolicitudInscripcion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solicitudesInscripcionAdminKeys.all });
      void queryClient.invalidateQueries({ queryKey: inscripcionesKeys.all });
    },
  });
}

export function useRechazarSolicitudInscripcion() {
  const queryClient = useQueryClient();
  return useMutation<SolicitudInscripcion, Error, { id: number; motivo: string }>({
    mutationFn: ({ id, motivo }) => rechazarSolicitudInscripcion(id, motivo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solicitudesInscripcionAdminKeys.all });
    },
  });
}
