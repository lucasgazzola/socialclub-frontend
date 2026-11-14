import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  obtenerCatalogoInscripcion,
  obtenerMisSolicitudesInscripcion,
  solicitarInscripcion,
} from '../api/inscripcion.api';
import type {
  CatalogoInscripcionResponse,
  EstadoSolicitudInscripcion,
  SolicitarInscripcionPayload,
  SolicitudInscripcion,
} from '../types';

export const solicitudesInscripcionKeys = {
  all: ['inscripcion', 'solicitudes'] as const,
  catalogo: ['inscripcion', 'catalogo'] as const,
  misSolicitudes: (estado?: EstadoSolicitudInscripcion) =>
    ['inscripcion', 'mis-solicitudes', estado ?? 'TODOS'] as const,
};

export function useCatalogoInscripcion(enabled = true) {
  return useQuery<CatalogoInscripcionResponse, Error>({
    queryKey: solicitudesInscripcionKeys.catalogo,
    queryFn: obtenerCatalogoInscripcion,
    enabled,
    refetchOnMount: 'always',
  });
}

export function useMisSolicitudesInscripcion(
  estado?: EstadoSolicitudInscripcion,
  enabled = true,
) {
  return useQuery<SolicitudInscripcion[], Error>({
    queryKey: solicitudesInscripcionKeys.misSolicitudes(estado),
    queryFn: () => obtenerMisSolicitudesInscripcion(estado),
    enabled,
    refetchOnMount: 'always',
  });
}

export function useSolicitarInscripcion({
  onSuccess,
}: {
  onSuccess?: (data: SolicitudInscripcion) => void;
} = {}) {
  const qc = useQueryClient();

  const mutation = useMutation<SolicitudInscripcion, Error, SolicitarInscripcionPayload>({
    mutationFn: (payload) => solicitarInscripcion(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: solicitudesInscripcionKeys.catalogo });
      qc.invalidateQueries({ queryKey: ['inscripcion', 'mis-solicitudes'] });
      toast.success('Solicitud de inscripción registrada con éxito. Estado: Pendiente.');
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'No se pudo registrar la solicitud de inscripción');
    },
  });

  return {
    solicitar: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.isError ? mutation.error?.message : null,
  };
}
