import { useMutation, useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagos.api';
import { pagosKeys } from './pagos.keys';

export function useMisCuotasDeportivas(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pagosKeys.misCuotasDeportivas(),
    queryFn: pagosApi.getMisCuotasDeportivas,
    enabled: options?.enabled,
  });
}

/** DT-35: crea la orden de pago de las cuotas deportivas elegidas. */
export function useIniciarPagoDeportivo() {
  return useMutation({
    mutationFn: (items: { disciplinaId: number; periodo: string }[]) =>
      pagosApi.iniciarPagoDeportivo(items),
  });
}
