import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crearInscripcion } from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';
import type { CrearInscripcionPayload, InscripcionCreada } from '../types';
import { toast } from 'sonner';

export function useCrearInscripcion() {
  const qc = useQueryClient();
  const mutation = useMutation<InscripcionCreada, Error, CrearInscripcionPayload>({
    mutationFn: crearInscripcion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('Inscripción registrada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    enviar: mutation.mutateAsync,
    enviando: mutation.isPending,
    error: mutation.isError ? mutation.error?.message : null,
  };
}