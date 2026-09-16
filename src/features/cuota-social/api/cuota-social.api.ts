import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type {
  ActualizarCuotaSocialDto,
  ConfiguracionCuotaSocial,
  ConfigurarCuotaSocialDto,
  CuotaSocialQuery,
} from '../types';

export const cuotaSocialApi = {
  async list(query: CuotaSocialQuery = {}): Promise<Paginated<ConfiguracionCuotaSocial>> {
    const { data } = await apiClient.get<Paginated<ConfiguracionCuotaSocial>>('/cuota-social', {
      params: {
        categoriaId: query.categoriaId || undefined,
        periodoAplicacion: query.periodoAplicacion || undefined,
        pagina: query.pagina,
        porPagina: query.porPagina,
      },
    });
    return data;
  },

  async create(payload: ConfigurarCuotaSocialDto): Promise<ConfiguracionCuotaSocial> {
    const { data } = await apiClient.post<ConfiguracionCuotaSocial>('/cuota-social', payload);
    return data;
  },

  async update(id: number, payload: ActualizarCuotaSocialDto): Promise<ConfiguracionCuotaSocial> {
    const { data } = await apiClient.patch<ConfiguracionCuotaSocial>(`/cuota-social/${id}`, payload);
    return data;
  },

  async getById(id: number): Promise<ConfiguracionCuotaSocial> {
    const { data } = await apiClient.get<ConfiguracionCuotaSocial>(`/cuota-social/${id}`);
    return data;
  },
};
