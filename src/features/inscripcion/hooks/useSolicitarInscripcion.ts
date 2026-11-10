import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  obtenerCatalogoInscripcion,
  obtenerMisSolicitudesInscripcion,
  solicitarInscripcion,
} from '../api/inscripcion.api';
import type {
  CatalogoInscripcionResponse,
  SolicitarInscripcionPayload,
  SolicitudInscripcion,
} from '../types';

export const solicitudesInscripcionKeys = {
  all: ['inscripcion', 'solicitudes'] as const,
  catalogo: ['inscripcion', 'catalogo'] as const,
  misSolicitudes: ['inscripcion', 'mis-solicitudes'] as const,
};

export function useCatalogoInscripcion() {
  return useQuery<CatalogoInscripcionResponse, Error>({
    queryKey: solicitudesInscripcionKeys.catalogo,
    queryFn: obtenerCatalogoInscripcion,
  });
}

export function useMisSolicitudesInscripcion() {
  return useQuery<SolicitudInscripcion[], Error>({
    queryKey: solicitudesInscripcionKeys.misSolicitudes,
    queryFn: obtenerMisSolicitudesInscripcion,
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
      qc.invalidateQueries({ queryKey: solicitudesInscripcionKeys.misSolicitudes });
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
