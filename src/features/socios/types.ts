import type { SocioFormData } from './schemas';

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
  activo: boolean;
  categoriaId?: number | null;
  categoria?: CategoriaSocio | null;
  creadoEn: string;
}

export type EstadoSocioFiltro = 'ALTA' | 'BAJA';

/** Parámetros del listado de socios (US-15: búsqueda, filtros + paginación). */
export interface SociosQuery {
  busqueda?: string;
  categoriaId?: number;
  estado?: EstadoSocioFiltro;
  pagina?: number;
  porPagina?: number;
}

<<<<<<< HEAD
<<<<<<< HEAD

=======
=======
>>>>>>> 0d96dd6 (feat[US-13]: editar socio)
/** Convierte un Socio (de API) en datos de formulario. */
export function socioToFormData(socio: Socio): SocioFormData {
  return {
    nombre: socio.nombre,
    apellido: socio.apellido,
    dni: socio.dni,
    fechaNacimiento: socio.fechaNacimiento ?? undefined,
    email: socio.email ?? undefined,
    telefono: socio.telefono ?? undefined,
    categoriaId: socio.categoriaId ?? undefined,
  };
}
<<<<<<< HEAD
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
=======
>>>>>>> 0d96dd6 (feat[US-13]: editar socio)
