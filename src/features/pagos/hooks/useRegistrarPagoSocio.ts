import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';
import type { RegistrarPagoSocioPayload } from '../types';

export function useRegistrarPagoSocio(socioId?: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrarPagoSocioPayload) => {
      if (!socioId) {
        throw new Error('Identificador de socio inválido.');
      }
      return pagosApi.registrarPagoSocio(socioId, payload);
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: pagosKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['socios'] });
      toast.success(data.mensaje || '¡Pago registrado con éxito!');
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al procesar el pago. Intentá nuevamente.',
      );
    },
  });
}
