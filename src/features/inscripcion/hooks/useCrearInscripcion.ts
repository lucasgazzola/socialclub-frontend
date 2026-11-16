import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearInscripcion } from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';
import type { CrearInscripcionPayload, InscripcionCreada } from '../types';
import { toast } from 'sonner';

/**
 * @param opciones.toastDeError en false el error no se muestra como toast: lo
 * muestra quien llama (ej. en el campo del formulario), para no duplicarlo.
 */
export function useCrearInscripcion({ toastDeError = true }: { toastDeError?: boolean } = {}) {
  const qc = useQueryClient();
  const mutation = useMutation<InscripcionCreada, Error, CrearInscripcionPayload>({
    mutationFn: crearInscripcion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('Inscripción registrada correctamente');
    },
    onError: (error: Error) => {
      if (toastDeError) toast.error(error.message);
    },
  });

  return {
    enviar: mutation.mutateAsync,
    enviando: mutation.isPending,
    error: mutation.isError ? mutation.error?.message : null,
  };
}