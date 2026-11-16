import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentacionApi } from '../api/documentacion.api';
import { habilitarExcepcional } from '@/features/inscripcion/api/inscripcion.api';
import type { CrearDocumentacionPayload, SubirMiDocumentacionPayload } from '../types';

export const documentacionKeys = {
  all: ['documentacion'] as const,
  porPersona: (personaId: number) => [...documentacionKeys.all, 'persona', personaId] as const,
  estado: (personaId: number) => [...documentacionKeys.all, 'estado', personaId] as const,
  alertas: () => [...documentacionKeys.all, 'alertas'] as const,
  pendientesRevision: () => [...documentacionKeys.all, 'pendientes-revision'] as const,
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

/** TASK-60: el titular sube su documento desde Mi club (queda en revisión). */
export function useSubirMiDocumentacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, archivo }: { payload: SubirMiDocumentacionPayload; archivo: File }) =>
      documentacionApi.subirMiDocumentacion(payload, archivo),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: documentacionKeys.porPersona(doc.personaId) });
      qc.invalidateQueries({ queryKey: documentacionKeys.estado(doc.personaId) });
    },
  });
}

/** TASK-60: bandeja de documentos para revisar (ADMIN y DELEGADO). */
export function usePendientesRevision(enabled = true) {
  return useQuery({
    queryKey: documentacionKeys.pendientesRevision(),
    queryFn: () => documentacionApi.pendientesRevision(),
    enabled,
  });
}

/** TASK-60: aprobar o rechazar un documento que subió el titular. */
export function useRevisarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; aprobar: true } | { id: number; aprobar: false; motivo: string }) =>
      v.aprobar ? documentacionApi.aprobar(v.id) : documentacionApi.rechazar(v.id, v.motivo),
    onSuccess: (doc, v) => {
      toast.success(v.aprobar ? 'Documento aprobado.' : 'Documento rechazado. Le avisamos al titular.');
      qc.invalidateQueries({ queryKey: documentacionKeys.pendientesRevision() });
      qc.invalidateQueries({ queryKey: documentacionKeys.porPersona(doc.personaId) });
      qc.invalidateQueries({ queryKey: documentacionKeys.estado(doc.personaId) });
      qc.invalidateQueries({ queryKey: documentacionKeys.alertas() });
      qc.invalidateQueries({ queryKey: ['inscripciones'] });
    },
    onError: (error: Error) => toast.error(error.message || 'No se pudo revisar el documento.'),
  });
}
