import { apiClient } from '@/lib/api/client';
import type {
  CuotasPendientesSocioResponse,
  PagoRealizado,
  RegistrarPagoPayload,
  RegistrarPagoSocioPayload,
  RespuestaPago,
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
};
