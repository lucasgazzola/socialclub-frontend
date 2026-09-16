/** Categoría de socio (catálogo de GET /categorias). Reusa el tipo de socios. */
export interface CategoriaSocio {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

/** Configuración de cuota social por categoría-período (US16). */
export interface ConfiguracionCuotaSocial {
  id: number;
  categoriaId: number;
  periodoAplicacion: string;
  monto: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  categoria: CategoriaSocio;
}

/** Payload de POST /cuota-social (crea o actualiza la combinación+período). */
export interface ConfigurarCuotaSocialDto {
  categoriaId: number;
  monto: number;
  periodoAplicacion?: string;
}

/** Payload de PATCH /cuota-social/:id. */
export interface ActualizarCuotaSocialDto {
  monto?: number;
  activo?: boolean;
}

/** Parámetros del listado de cuotas sociales (filtros + paginación). */
export interface CuotaSocialQuery {
  categoriaId?: number;
  periodoAplicacion?: string;
  pagina?: number;
  porPagina?: number;
}
