import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activarParticipante } from '../api/inscripcion.api';
import type { ActivarParticipantePayload } from '../types';
import { inscripcionesKeys } from './useInscripciones';

/**
 * US-07 — Reactivar / dar de alta a un participante dado de baja junto con
 * las disciplinas seleccionadas.
 */
export function useActivarParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      arg: number | { personaId: number; payload?: ActivarParticipantePayload },
    ) => {
      if (typeof arg === 'number') {
        return activarParticipante(arg);
      }
      return activarParticipante(arg.personaId, arg.payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('Participante dado de alta correctamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al dar de alta al participante');
    },
  });
}