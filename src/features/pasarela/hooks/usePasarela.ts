import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pasarelaApi } from '../api/pasarela.api';
import type { OrdenPago } from '../types';

export const pasarelaKeys = {
  all: ['pasarela'] as const,
  orden: (referencia: string) => [...pasarelaKeys.all, 'orden', referencia] as const,
};

/**
 * Redirige a la pasarela. Es una navegación completa (sale de la SPA): la
 * sesión vuelve con la cookie al regresar a `/pagos/resultado`.
 */
export function irAPagar(urlPago: string) {
  window.location.assign(urlPago);
}

export function useOrdenPago(referencia: string | null) {
  return useQuery({
    queryKey: pasarelaKeys.orden(referencia ?? ''),
    queryFn: () => pasarelaApi.obtener(referencia!),
    enabled: !!referencia,
  });
}

/** Al aprobarse un pago cambian cuotas, historial, entradas y cupos. */
function useAlResolver() {
  const qc = useQueryClient();
  return (orden: OrdenPago) => {
    qc.setQueryData(pasarelaKeys.orden(orden.referencia), orden);
    if (orden.estado === 'APROBADA') {
      void qc.invalidateQueries({ queryKey: ['pagos'] });
      void qc.invalidateQueries({ queryKey: ['entradas'] });
      void qc.invalidateQueries({ queryKey: ['eventos'] });
    }
  };
}

export function useConfirmarOrden() {
  const alResolver = useAlResolver();
  return useMutation({
    mutationFn: ({ referencia, idPago }: { referencia: string; idPago?: string }) =>
      pasarelaApi.confirmar(referencia, idPago),
    onSuccess: alResolver,
  });
}

export function useCancelarOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (referencia: string) => pasarelaApi.cancelar(referencia),
    onSuccess: (orden) => {
      qc.setQueryData(pasarelaKeys.orden(orden.referencia), orden);
      // Al cancelar se libera el cupo reservado (o se acreditó, si ya estaba pago).
      void qc.invalidateQueries({ queryKey: ['eventos'] });
      void qc.invalidateQueries({ queryKey: ['pagos'] });
    },
  });
}

export function useSimularPago() {
  const alResolver = useAlResolver();
  return useMutation({
    mutationFn: ({ referencia, aprobado }: { referencia: string; aprobado: boolean }) =>
      pasarelaApi.simular(referencia, aprobado),
    onSuccess: alResolver,
  });
}
