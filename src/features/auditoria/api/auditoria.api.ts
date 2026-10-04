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
        periodo:
          query.periodo && query.periodo !== 'todo'
            ? query.periodo
            : undefined,
        fechaDesde:
          query.periodo === 'personalizado' || !query.periodo || query.periodo === 'todo'
            ? query.fechaDesde || undefined
            : undefined,
        fechaHasta:
          (query.periodo === 'personalizado' || !query.periodo || query.periodo === 'todo') && query.fechaHasta
            ? (query.fechaHasta.includes('T') ? query.fechaHasta : `${query.fechaHasta}T23:59:59.999Z`)
            : undefined,
        pagina: query.pagina,
        porPagina: query.porPagina,
      },
    });
    return data;
  },
};