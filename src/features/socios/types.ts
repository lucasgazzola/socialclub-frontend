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

/** Parámetros del listado de socios (búsqueda + paginación). */
export interface SociosQuery {
  busqueda?: string;
  pagina?: number;
  porPagina?: number;
}
