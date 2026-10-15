import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentacionApi } from '../api/documentacion.api';
import { habilitarExcepcional } from '@/features/inscripcion/api/inscripcion.api';
import type { CrearDocumentacionPayload } from '../types';

export const documentacionKeys = {
  all: ['documentacion'] as const,
  porPersona: (personaId: number) => [...documentacionKeys.all, 'persona', personaId] as const,
  estado: (personaId: number) => [...documentacionKeys.all, 'estado', personaId] as const,
  alertas: () => [...documentacionKeys.all, 'alertas'] as const,
};

/** Carga un documento obligatorio (US-24) e invalida la lista del participante. */
export function useCrearDocumentacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, archivo }: { payload: CrearDocumentacionPayload; archivo?: File | null }) =>
      documentacionApi.crear(payload, archivo),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: documentacionKeys.porPersona(doc.personaId) });
      qc.invalidateQueries({ queryKey: documentacionKeys.estado(doc.personaId) });
      qc.invalidateQueries({ queryKey: documentacionKeys.alertas() });
      // El listado de participantes muestra el estado documental.
      qc.invalidateQueries({ queryKey: ['inscripciones'] });
    },
  });
}

/** Lista la documentación de un participante. */
export function useDocumentacionPorPersona(personaId: number | null) {
  return useQuery({
    queryKey: documentacionKeys.porPersona(personaId ?? 0),
    queryFn: () => documentacionApi.listarPorPersona(personaId as number),
    enabled: !!personaId,
  });
}

/** US-25: estado documental del participante por inscripción. */
export function useEstadoDocumental(personaId: number | null) {
  return useQuery({
    queryKey: documentacionKeys.estado(personaId ?? 0),
    queryFn: () => documentacionApi.estadoPorPersona(personaId as number),
    enabled: !!personaId,
  });
}

/** US-26: alertas de documentación para el Inicio (ADMIN y DELEGADO). */
export function useAlertasDocumentacion(enabled = true) {
  return useQuery({
    queryKey: documentacionKeys.alertas(),
    queryFn: () => documentacionApi.alertas(),
    enabled,
  });
}

/** US-28: registrar la habilitación excepcional de una inscripción bloqueada. */
export function useHabilitarExcepcional(personaId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inscripcionId,
      payload,
    }: {
      inscripcionId: number;
      payload: { motivo: string; dias: number };
    }) => habilitarExcepcional(inscripcionId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: documentacionKeys.estado(personaId) });
      void qc.invalidateQueries({ queryKey: documentacionKeys.alertas() });
      void qc.invalidateQueries({ queryKey: ['inscripciones'] });
      toast.success('Habilitación excepcional registrada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar la habilitación excepcional',
      );
    },
  });
}
