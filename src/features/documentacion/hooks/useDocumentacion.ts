import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentacionApi } from '../api/documentacion.api';
import type { CrearDocumentacionPayload } from '../types';

export const documentacionKeys = {
  all: ['documentacion'] as const,
  porPersona: (personaId: number) => [...documentacionKeys.all, 'persona', personaId] as const,
};

/** Carga un documento obligatorio (US-24) e invalida la lista del participante. */
export function useCrearDocumentacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, archivo }: { payload: CrearDocumentacionPayload; archivo?: File | null }) =>
      documentacionApi.crear(payload, archivo),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: documentacionKeys.porPersona(doc.personaId) });
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
