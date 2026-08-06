/** Catálogo de disciplinas deportivas expuesto por GET /disciplinas. */
export interface Disciplina {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn?: string;
}

/** Categoría de socio (catálogo de GET /categorias). */
export interface CategoriaSocio {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

/** Configuración de cuota deportiva por disciplina-categoría-período. */
export interface ConfiguracionCuotaDeportiva {
  id: number;
  disciplinaId: number;
  categoriaId: number;
  periodoAplicacion: string;
  monto: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  disciplina: Disciplina;
  categoria: CategoriaSocio;
}

/** Payload de POST /cuotas (crea o actualiza la combinación+período). */
export interface ConfigurarCuotaDto {
  disciplinaId: number;
  categoriaId: number;
  monto: number;
  periodoAplicacion?: string;
}

/** Payload de PATCH /cuotas/:id (solo monto/estado). */
export interface ActualizarCuotaDto {
  monto?: number;
  activo?: boolean;
}

/** Parámetros del listado de cuotas (filtros + paginación). */
export interface CuotasQuery {
  disciplinaId?: number;
  categoriaId?: number;
  periodoAplicacion?: string;
  pagina?: number;
  porPagina?: number;
}
