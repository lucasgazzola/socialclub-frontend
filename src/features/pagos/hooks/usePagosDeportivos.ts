import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { RegistrarPagoDeportivoPayload } from '../types';

/** US-21 — Cuotas deportivas pendientes y estado de deuda de un participante. */
export function usePendientesDeportivos(personaId?: number | null) {
  return useQuery({
    queryKey: pagosKeys.pendientesDeportivos(personaId!),
    queryFn: () => pagosApi.getPendientesDeportivos(personaId!),
    enabled: typeof personaId === 'number' && personaId > 0,
  });
}

/** US-21 — Registrar el pago de una o varias cuotas deportivas de un participante. */
export function useRegistrarPagoDeportivo(personaId?: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrarPagoDeportivoPayload) => {
      if (!personaId) {
        throw new Error('Identificador de participante inválido.');
      }
      return pagosApi.registrarPagoDeportivo(personaId, payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: pagosKeys.all });
      toast.success(data.mensaje || '¡Pago de cuota deportiva registrado!');
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al procesar el pago. Intentá nuevamente.',
      );
    },
  });
}
