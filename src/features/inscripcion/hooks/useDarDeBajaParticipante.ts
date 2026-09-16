import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { darDeBajaParticipante } from '../api/inscripcion.api';
import { inscripcionesKeys } from './useInscripciones';

/**
 * US-07 — Dar de baja a un participante.
 *
 * La baja alcanza a todas sus disciplinas, así que invalida el listado
 * (US-08) y el detalle por persona: la fila pasa a estado Baja y el detalle
 * muestra las disciplinas dadas de baja. La confirmación es del ConfirmDialog;
 * acá sólo queda el mensaje de resultado.
 */
export function useDarDeBajaParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personaId: number) => darDeBajaParticipante(personaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('El participante fue dado de baja y no podrá participar de ninguna disciplina');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al dar de baja al participante');
    },
  });
}