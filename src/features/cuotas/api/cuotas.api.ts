import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type {
  ActualizarCuotaDto,
  ConfiguracionCuotaDeportiva,
  ConfigurarCuotaDto,
  CuotasQuery,
} from '../types';

export const cuotasApi = {
  async list(query: CuotasQuery = {}): Promise<Paginated<ConfiguracionCuotaDeportiva>> {
    const { data } = await apiClient.get<Paginated<ConfiguracionCuotaDeportiva>>('/cuotas', {
      params: {
        disciplinaId: query.disciplinaId || undefined,
        categoriaId: query.categoriaId || undefined,
        periodoAplicacion: query.periodoAplicacion || undefined,
        pagina: query.pagina,
        porPagina: query.porPagina,
      },
    });
    return data;
  },

  async create(payload: ConfigurarCuotaDto): Promise<ConfiguracionCuotaDeportiva> {
    const { data } = await apiClient.post<ConfiguracionCuotaDeportiva>('/cuotas', payload);
    return data;
  },

  async update(
    id: number,
    payload: ActualizarCuotaDto,
  ): Promise<ConfiguracionCuotaDeportiva> {
    const { data } = await apiClient.patch<ConfiguracionCuotaDeportiva>(`/cuotas/${id}`, payload);
    return data;
  },
};
