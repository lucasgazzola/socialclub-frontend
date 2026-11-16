import type { SocioFormData } from './schemas';
import type { GeneroDisciplina } from '@/features/disciplinas/types';

export type { SocioFormData };

export interface CategoriaSocio {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  genero?: GeneroDisciplina | null;
  activo: boolean;
  categoriaId?: number | null;
  categoria?: CategoriaSocio | null;
  /** Fecha de alta del socio */
  fechaAlta?: string;
  usuarioId?: number | null;
  creadoEn: string;
}

export type EstadoSocioFiltro = 'ALTA' | 'BAJA';

/** Misma regla de mora que el badge de la fila y que el listado de morosos. */
export type EstadoCuentaSocioFiltro = 'MOROSO' | 'AL_DIA';

/** Parámetros del listado de socios (US-15: búsqueda, filtros + paginación). */
export interface SociosQuery {
  busqueda?: string;
  categoriaId?: number;
  estado?: EstadoSocioFiltro;
  estadoCuenta?: EstadoCuentaSocioFiltro;
  pagina?: number;
  porPagina?: number;
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
}

/** Convierte un Socio (de API) en datos de formulario. */
export function socioToFormData(socio: Socio): SocioFormData {
  return {
    nombre: socio.nombre,
    apellido: socio.apellido,
    dni: socio.dni,
    fechaNacimiento: socio.fechaNacimiento ?? undefined,
    genero: socio.genero ?? undefined,
    email: socio.email ?? undefined,
    telefono: socio.telefono ?? undefined,
    categoriaId: socio.categoriaId ?? undefined,
  };
}
