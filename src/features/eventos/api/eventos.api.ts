import { apiClient } from '@/lib/api/client';
import { localAInstante } from '@/lib/utils/fecha';
import type { Evento, CrearEventoFormData, EventosPaginados } from '../types';

export interface FiltrarEventosParams {
  search?: string;
  soloDisponibles?: boolean;
  incluirBorradores?: boolean;
  ordenar?: 'nombre' | 'reciente' | 'fecha';
  pagina?: number;
  porPagina?: number;
}

export const eventosApi = {
  async list(params?: FiltrarEventosParams): Promise<EventosPaginados> {
    const { data } = await apiClient.get<EventosPaginados>('/eventos', {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.soloDisponibles ? { soloDisponibles: 'true' } : {}),
        ...(params?.incluirBorradores ? { incluirBorradores: 'true' } : {}),
        ...(params?.ordenar ? { ordenar: params.ordenar } : {}),
        ...(params?.pagina ? { pagina: params.pagina } : {}),
        ...(params?.porPagina ? { porPagina: params.porPagina } : {}),
      },
    });
    return data;
  },

  async getById(id: number): Promise<Evento> {
    const { data } = await apiClient.get<Evento>(`/eventos/${id}`);
    return data;
  },

  async create(formData: CrearEventoFormData): Promise<Evento> {
    const { data } = await apiClient.post<Evento>('/eventos', conInstantes(formData));
    return data;
  },

  async update(id: number, formData: Partial<CrearEventoFormData>): Promise<Evento> {
    const { data } = await apiClient.patch<Evento>(`/eventos/${id}`, conInstantes(formData));
    return data;
  },
};

/** Las fechas del formulario (hora local) viajan como instantes ISO con zona. */
function conInstantes<T extends Partial<CrearEventoFormData>>(datos: T): T {
  return {
    ...datos,
    ...(datos.fechaEvento !== undefined ? { fechaEvento: localAInstante(datos.fechaEvento) } : {}),
    ...(datos.fechaFin !== undefined ? { fechaFin: localAInstante(datos.fechaFin) } : {}),
    ...(datos.inicioVenta !== undefined ? { inicioVenta: localAInstante(datos.inicioVenta) } : {}),
    ...(datos.finVenta !== undefined ? { finVenta: localAInstante(datos.finVenta) } : {}),
  };
}
