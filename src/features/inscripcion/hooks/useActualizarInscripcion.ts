import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actualizarInscripcion } from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';
import type { CrearInscripcionPayload } from '../types';

export function useActualizarInscripcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CrearInscripcionPayload }) =>
      actualizarInscripcion(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inscripcionesKeys.all }),
  });
}