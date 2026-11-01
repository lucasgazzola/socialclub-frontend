import { useMutation } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';

/**
 * US-10 · TASK-51: crea la orden de pago de las cuotas elegidas. La página
 * redirige a `urlPago`; los pagos se registran cuando la pasarela confirma.
 */
export function useIniciarPagoCuotas() {
  return useMutation({
    mutationFn: (periodos: string[]) => pagosApi.iniciarPagoCuotas(periodos),
  });
}
