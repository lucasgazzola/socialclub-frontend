import { apiClient } from '@/lib/api/client';
import type {
  PagoRealizado,
  RegistrarPagoPayload,
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
};
