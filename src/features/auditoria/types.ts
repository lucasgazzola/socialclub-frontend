import type { AccionAuditoria } from './constants';

export interface RegistroAuditoria {
  id: number;
  fechaHora: string;
  accion: AccionAuditoria;
  entidad: string;
  idEntidad?: number;
  detalle?: string;
  responsable?: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
  };
}

export type PeriodoAuditoriaFiltro = 'todo' | '1h' | '24h' | '7d' | 'personalizado';

export interface AuditoriaQuery {
  accion?: AccionAuditoria;
  entidad?: string;
  responsableId?: number;
  periodo?: PeriodoAuditoriaFiltro;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  porPagina?: number;
}