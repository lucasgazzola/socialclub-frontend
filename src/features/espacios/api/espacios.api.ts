import { apiClient } from '@/lib/api/client';
import type {
  BloqueoAgenda,
  CreateBloqueoPayload,
  CreateEspacioPayload,
  Espacio,
  EspaciosPaginatedResponse,
  FindEspaciosQuery,
} from '../types';

export const espaciosApi = {
  /** US-55: Lista los espacios físicos del club (paginado con counts o catálogo simple). */
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

  /** US-55 / US-56: Configura un nuevo bloqueo de agenda para un espacio existente. */
  async agregarBloqueo(espacioId: number, payload: CreateBloqueoPayload): Promise<BloqueoAgenda> {
    const response = await apiClient.post<BloqueoAgenda>(
      `/espacios/${espacioId}/bloqueos`,
      payload,
    );
    return response.data;
  },
};
