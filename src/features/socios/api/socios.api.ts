import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { Socio, SocioFormData, SociosQuery } from '../types';

export const sociosApi = {
  async list(query: SociosQuery = {}): Promise<Paginated<Socio>> {
    const { data } = await apiClient.get<Paginated<Socio>>('/socios', {
      params: {
        busqueda: query.busqueda || undefined,
        categoriaId: query.categoriaId || undefined,
        estado: query.estado || undefined,
        pagina: query.pagina,
        porPagina: query.porPagina,
      },
    });
    return data;
  },

  async getById(id: number): Promise<Socio> {
    const { data } = await apiClient.get<Socio>(`/socios/${id}`);
    return data;
  },

  async update(id: number, formData: Partial<SocioFormData>): Promise<Socio> {
    const { data } = await apiClient.patch<Socio>(`/socios/${id}`, formData);
    return data;
  },

  async update(id: number, formData: Partial<SocioFormData>): Promise<Socio> {
    const { data } = await apiClient.patch<Socio>(`/socios/${id}`, formData);
    return data;
  },

  async deactivate(id: number): Promise<Socio> {
  const { data } = await apiClient.delete<Socio>(`/socios/${id}`);
  return data;
  },
};
