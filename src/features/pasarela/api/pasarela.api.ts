import { apiClient } from '@/lib/api/client';
import type { OrdenPago } from '../types';

/** TASK-51 · Órdenes de pago online (se crean desde cada dominio: cuotas, entradas). */
export const pasarelaApi = {
  async obtener(referencia: string): Promise<OrdenPago> {
    const { data } = await apiClient.get<OrdenPago>(`/pasarela/ordenes/${referencia}`);
    return data;
  },

  /** A la vuelta de la pasarela: la API consulta el estado real del pago y acredita. */
  async confirmar(referencia: string, idPago?: string): Promise<OrdenPago> {
    const { data } = await apiClient.post<OrdenPago>(
      `/pasarela/ordenes/${referencia}/confirmar`,
      idPago ? { idPago } : {},
    );
    return data;
  },

  async cancelar(referencia: string): Promise<OrdenPago> {
    const { data } = await apiClient.post<OrdenPago>(`/pasarela/ordenes/${referencia}/cancelar`);
    return data;
  },

  /** Solo con la pasarela simulada (desarrollo y E2E). */
  async simular(referencia: string, aprobado: boolean): Promise<OrdenPago> {
    const { data } = await apiClient.post<OrdenPago>(`/pasarela/ordenes/${referencia}/simular`, {
      aprobado,
    });
    return data;
  },
};
