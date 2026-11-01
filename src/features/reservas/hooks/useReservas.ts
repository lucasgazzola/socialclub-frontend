import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '../api/reservas.api';
import type { EstadoReserva, MetodoPagoSena } from '../types';

export const reservasKeys = {
  all: ['reservas'] as const,
  solicitudes: (estados: EstadoReserva[], busqueda: string) =>
    [...reservasKeys.all, 'solicitudes', estados.join(','), busqueda] as const,
  mias: () => [...reservasKeys.all, 'mias'] as const,
};

export function useSolicitudesReserva(estados: EstadoReserva[], busqueda = '') {
  return useQuery({
    queryKey: reservasKeys.solicitudes(estados, busqueda),
    queryFn: () => reservasApi.solicitudes(estados, busqueda),
  });
}

export function useMisReservas() {
  return useQuery({ queryKey: reservasKeys.mias(), queryFn: reservasApi.mias });
}

/** Cualquier acción cambia la bandeja y «Mis Reservas». */
function useAccion<V>(fn: (v: V) => Promise<{ mensaje: string }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: reservasKeys.all }),
  });
}

export const useAprobarReserva = () => useAccion((id: number) => reservasApi.aprobar(id));
export const useRechazarReserva = () =>
  useAccion(({ id, motivo }: { id: number; motivo: string }) => reservasApi.rechazar(id, motivo));
export const useRegistrarSena = () =>
  useAccion(({ id, metodoPago }: { id: number; metodoPago: MetodoPagoSena }) =>
    reservasApi.registrarSena(id, metodoPago),
  );
export const useCancelarPorInstitucion = () =>
  useAccion(({ id, motivo }: { id: number; motivo: string }) =>
    reservasApi.cancelarPorInstitucion(id, motivo),
  );
export const useCancelarPorFaltaPago = () =>
  useAccion((id: number) => reservasApi.cancelarPorFaltaPago(id));
export const useCancelarMiReserva = () => useAccion((id: number) => reservasApi.cancelar(id));

export function usePagarSena() {
  return useMutation({ mutationFn: (id: number) => reservasApi.pagarSena(id) });
}
