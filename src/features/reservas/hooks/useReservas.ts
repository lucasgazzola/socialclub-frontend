import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '../api/reservas.api';
import type {
  CreateReservaInput,
  EstadoReserva,
  MetodoPagoSena,
  SolicitudPresupuestoInput,
} from '../types';

export const reservasKeys = {
  all: ['reservas'] as const,
  espacios: () => [...reservasKeys.all, 'espacios'] as const,
  disponibilidad: (espacioId: number, desde: string, hasta: string) =>
    [...reservasKeys.all, 'disponibilidad', espacioId, desde, hasta] as const,
  presupuesto: (input: SolicitudPresupuestoInput | null) =>
    [...reservasKeys.all, 'presupuesto', input] as const,
  solicitudes: (estados: EstadoReserva[], busqueda: string) =>
    [...reservasKeys.all, 'solicitudes', estados.join(','), busqueda] as const,
  mias: () => [...reservasKeys.all, 'mias'] as const,
};

export function useEspaciosParaReserva() {
  return useQuery({
    queryKey: reservasKeys.espacios(),
    queryFn: reservasApi.espaciosDisponibles,
  });
}

export function useDisponibilidadEspacio(
  espacioId: number | null,
  desde: string,
  hasta: string,
) {
  return useQuery({
    queryKey: reservasKeys.disponibilidad(espacioId ?? 0, desde, hasta),
    queryFn: () => reservasApi.disponibilidad(espacioId!, desde, hasta),
    enabled: espacioId !== null && Boolean(desde) && Boolean(hasta),
  });
}

export function usePresupuestoReserva(input: SolicitudPresupuestoInput | null) {
  return useQuery({
    queryKey: reservasKeys.presupuesto(input),
    queryFn: () => reservasApi.presupuesto(input!),
    enabled: input !== null,
  });
}

export const useSolicitarReserva = () =>
  useAccion((input: CreateReservaInput) => reservasApi.solicitar(input));

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
function useAccion<V, R extends { mensaje: string } = { mensaje: string }>(fn: (v: V) => Promise<R>) {
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
