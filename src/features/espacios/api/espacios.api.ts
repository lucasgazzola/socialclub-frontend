import { apiClient } from '@/lib/api/client';
import type {
  BloqueoAgenda,
  CreateBloqueoPayload,
  CreateEspacioPayload,
  Espacio,
  EspaciosPaginatedResponse,
  FindEspaciosQuery,
  UpdateBloqueoPayload,
  UpdateEspacioPayload,
} from '../types';

export const espaciosApi = {
  /** US-55 / US-58: Lista los espacios físicos del club (paginado con counts o catálogo simple). */
  async list(query?: FindEspaciosQuery): Promise<EspaciosPaginatedResponse | Espacio[]> {
    const response = await apiClient.get<EspaciosPaginatedResponse | Espacio[]>('/espacios', {
      params: query,
    });
    return response.data;
  },

  /** Obtiene el detalle de un espacio con sus disciplinas, sub-espacios y bloqueos vigentes. */
  async getById(id: number): Promise<Espacio> {
    const response = await apiClient.get<Espacio>(`/espacios/${id}`);
    return response.data;
  },

  /** US-55: Registra un nuevo espacio físico con sus sub-espacios, disciplinas y bloqueos iniciales. */
  async create(payload: CreateEspacioPayload): Promise<Espacio> {
    const response = await apiClient.post<Espacio>('/espacios', payload);
    return response.data;
  },

  /** US-56: Modifica datos generales, tarifas o disciplinas de un espacio existente. */
  async update(id: number, payload: UpdateEspacioPayload): Promise<Espacio> {
    const response = await apiClient.patch<Espacio>(`/espacios/${id}`, payload);
    return response.data;
  },

  /** US-55 / US-56: Configura un nuevo bloqueo de agenda para un espacio existente. */
  async agregarBloqueo(espacioId: number, payload: CreateBloqueoPayload): Promise<BloqueoAgenda> {
    const response = await apiClient.post<BloqueoAgenda>(
      `/espacios/${espacioId}/bloqueos`,
      payload,
    );
    return response.data;
  },

  /** US-56: Modifica un bloqueo de agenda existente. */
  async updateBloqueo(
    espacioId: number,
    bloqueoId: number,
    payload: UpdateBloqueoPayload,
  ): Promise<BloqueoAgenda> {
    const response = await apiClient.patch<BloqueoAgenda>(
      `/espacios/${espacioId}/bloqueos/${bloqueoId}`,
      payload,
    );
    return response.data;
  },

  /** US-56: Elimina lógicamente un bloqueo de agenda. */
  async deleteBloqueo(
    espacioId: number,
    bloqueoId: number,
  ): Promise<{ mensaje: string; bloqueoId: number }> {
    const response = await apiClient.delete<{ mensaje: string; bloqueoId: number }>(
      `/espacios/${espacioId}/bloqueos/${bloqueoId}`,
    );
    return response.data;
  },

  /** US-57: Da de baja lógicamente un espacio físico y sus sub-espacios asociados. */
  async remove(id: number): Promise<{ mensaje: string; id: number }> {
    const response = await apiClient.delete<{ mensaje: string; id: number }>(`/espacios/${id}`);
    return response.data;
  },

  /** US-57: Reactiva un espacio físico dado de baja lógica y sus sub-espacios asociados. */
  async reactivar(id: number): Promise<{ mensaje: string; id: number }> {
    const response = await apiClient.patch<{ mensaje: string; id: number }>(
      `/espacios/${id}/reactivar`,
    );
    return response.data;
  },
};
