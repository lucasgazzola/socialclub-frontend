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

export interface AuditoriaQuery {
  accion?: AccionAuditoria;
  entidad?: string;
  responsableId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  porPagina?: number;
}