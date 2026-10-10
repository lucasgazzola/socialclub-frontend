import { apiClient } from '@/lib/api/client';
import type {
  CuotasPendientesSocioResponse,
  HistorialDeportivoFiltro,
  HistorialDeportivoResponse,
  PagoRealizado,
  PendientesDeportivosResponse,
  RegistrarPagoDeportivoPayload,
  RegistrarPagoPayload,
  RegistrarPagoSocioPayload,
  RespuestaPago,
  RespuestaPagoDeportivo,
  ResumenCuotas,
} from '../types';

export const pagosApi = {
  async getMisCuotas(): Promise<ResumenCuotas> {
    const { data } = await apiClient.get<ResumenCuotas>('/pagos/mis-cuotas');
    return data;
  },

  async registrarPago(payload: RegistrarPagoPayload): Promise<RespuestaPago> {
    const { data } = await apiClient.post<RespuestaPago>('/pagos/registrar', payload);
    return data;
  },

  async getHistorial(): Promise<PagoRealizado[]> {
    const { data } = await apiClient.get<PagoRealizado[]>('/pagos/historial');
    return data;
  },

  async getCuotasPendientesSocio(socioId: number): Promise<CuotasPendientesSocioResponse> {
    const { data } = await apiClient.get<CuotasPendientesSocioResponse>(
      `/pagos/socio/${socioId}/cuotas-pendientes`,
    );
    return data;
  },

  async registrarPagoSocio(
    socioId: number,
    payload: RegistrarPagoSocioPayload,
  ): Promise<RespuestaPago> {
    const { data } = await apiClient.post<RespuestaPago>(`/pagos/socio/${socioId}`, payload);
    return data;
  },

  // ── US-21 · Cuota deportiva (secretaría) ────────────────────────────────────

  async getPendientesDeportivos(personaId: number): Promise<PendientesDeportivosResponse> {
    const { data } = await apiClient.get<PendientesDeportivosResponse>(
      `/pagos-deportivos/persona/${personaId}/pendientes`,
    );
    return data;
  },

  async registrarPagoDeportivo(
    personaId: number,
    payload: RegistrarPagoDeportivoPayload,
  ): Promise<RespuestaPagoDeportivo> {
    const { data } = await apiClient.post<RespuestaPagoDeportivo>(
      `/pagos-deportivos/persona/${personaId}`,
      payload,
    );
    return data;
  },

  async getHistorialDeportivo(
    personaId: number,
    filtro: HistorialDeportivoFiltro = {},
  ): Promise<HistorialDeportivoResponse> {
    const { data } = await apiClient.get<HistorialDeportivoResponse>(
      `/pagos-deportivos/persona/${personaId}/historial`,
      { params: filtro },
    );
    return data;
  },

  // ── US-19 · Morosos de cuota social ──────────────────────────────────────────

  async getMorososCuotaSocial(
    filtros: import('../types').FiltrosMorososCuotaSocial = {},
  ): Promise<import('../types').MorososCuotaSocialResponse> {
    const { data } = await apiClient.get<import('../types').MorososCuotaSocialResponse>(
      '/pagos/morosos',
      { params: filtros },
    );
    return data;
  },

  // ── US-23 · Morosos de cuota deportiva ──────────────────────────────────────

  async getMorososCuotaDeportiva(
    filtros: import('../types').FiltrosMorososCuotaDeportiva = {},
  ): Promise<import('../types').MorososCuotaDeportivaResponse> {
    const { data } = await apiClient.get<import('../types').MorososCuotaDeportivaResponse>(
      '/pagos-deportivos/morosos',
      { params: filtros },
    );
    return data;
  },
};

