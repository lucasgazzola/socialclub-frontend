import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activarParticipante } from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';

/**
 * US-07 — Reactivar a un participante dado de baja.
 *
 * Solo cambia el estado del participante y lo audita: las disciplinas no se
 * re-inscriben solas (cada inscripción tiene su propio flujo).
 */
export function useActivarParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personaId: number) => activarParticipante(personaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('El participante fue reactivado: ya se lo puede inscribir de nuevo');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al reactivar al participante');
    },
  });
}