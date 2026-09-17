import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { RegistrarPagoPayload } from '../types';

export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrarPagoPayload) => pagosApi.registrarPago(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: pagosKeys.all });
      toast.success(data.mensaje || '¡Pago registrado con éxito!');
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al procesar el pago. Intentá nuevamente.',
      );
    },
  });
}
