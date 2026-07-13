import { apiClient } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { RegistroAuditoria, AuditoriaQuery } from '../types';

export const auditoriaApi = {
  async list(query: AuditoriaQuery = {}): Promise<Paginated<RegistroAuditoria>> {
    const { data } = await apiClient.get<Paginated<RegistroAuditoria>>('/auditoria', {
      params: {
        accion: query.accion || undefined,
        entidad: query.entidad || undefined,
        responsableId: query.responsableId || undefined,
        fechaDesde: query.fechaDesde || undefined,
        fechaHasta: query.fechaHasta || undefined,
        pagina: query.pagina,
        porPagina: query.porPagina,
      },
    });
    return data;
  },
};