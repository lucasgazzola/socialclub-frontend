import { apiClient } from '@/lib/api/client';
import type { OrdenPago } from '@/features/pasarela/types';
import type {
  EstadoReserva,
  MetodoPagoSena,
  MiReserva,
  ResultadoAccion,
  SolicitudReserva,
} from '../types';

export const reservasApi = {
  /** US-60: bandeja de la administración. */
  async solicitudes(estados: EstadoReserva[], busqueda?: string): Promise<SolicitudReserva[]> {
    const { data } = await apiClient.get<SolicitudReserva[]>('/reservas/solicitudes', {
      params: { estado: estados.join(','), ...(busqueda ? { busqueda } : {}) },
    });
    return data;
  },

  async aprobar(id: number): Promise<ResultadoAccion> {
    const { data } = await apiClient.patch<ResultadoAccion>(`/reservas/${id}/aprobar`);
    return data;
  },

  async rechazar(id: number, motivo: string): Promise<ResultadoAccion> {
    const { data } = await apiClient.patch<ResultadoAccion>(`/reservas/${id}/rechazar`, { motivo });
    return data;
  },

  async registrarSena(id: number, metodoPago: MetodoPagoSena): Promise<ResultadoAccion> {
    const { data } = await apiClient.post<ResultadoAccion>(`/reservas/${id}/sena`, { metodoPago });
    return data;
  },

  /** US-61: cancelación por la institución, con motivo. */
  async cancelarPorInstitucion(id: number, motivo: string): Promise<ResultadoAccion> {
    const { data } = await apiClient.post<ResultadoAccion>(`/reservas/${id}/cancelar-institucion`, {
      motivo,
    });
    return data;
  },

  async cancelarPorFaltaPago(id: number): Promise<ResultadoAccion> {
    const { data } = await apiClient.post<ResultadoAccion>(`/reservas/${id}/cancelar-falta-pago`);
    return data;
  },

  /** US-62. */
  async mias(): Promise<MiReserva[]> {
    const { data } = await apiClient.get<MiReserva[]>('/reservas/mias');
    return data;
  },

  /** US-61: el solicitante cancela su reserva. */
  async cancelar(id: number): Promise<ResultadoAccion> {
    const { data } = await apiClient.post<ResultadoAccion>(`/reservas/${id}/cancelar`);
    return data;
  },

  /** US-60: pago online de la seña (devuelve la orden con la URL de la pasarela). */
  async pagarSena(id: number): Promise<OrdenPago> {
    const { data } = await apiClient.post<OrdenPago>(`/reservas/${id}/sena/checkout`);
    return data;
  },
};
