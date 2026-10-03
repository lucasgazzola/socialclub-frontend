/** Catálogo de disciplinas deportivas expuesto por GET /disciplinas. */
export interface Disciplina {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn?: string;
  /** Categorías de la disciplina (TASK-33: una categoría puede tener tarifa propia). */
  categorias?: { id: number; nombre: string; activo: boolean }[];
}

/** Categoría de socio (catálogo de GET /categorias). */
export interface CategoriaSocio {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Tarifa mensual de la cuota deportiva (US-20 · TASK-33). Sin categoría es la
 * tarifa base de la disciplina; con categoría, la reemplaza para esa categoría.
 */
export interface ConfiguracionCuotaDeportiva {
  id: number;
  disciplinaId: number;
  categoriaDisciplinaId: number | null;
  periodoAplicacion: string;
  monto: number;
  /** Descuento para socios, en porcentaje (0 a 100). */
  descuentoSocioPorcentaje: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  disciplina: { id: number; nombre: string };
  categoriaDisciplina: { id: number; nombre: string } | null;
}

/** Payload de POST /cuotas (crea o actualiza la tarifa de ese alcance y período). */
export interface ConfigurarCuotaDto {
  disciplinaId: number;
  categoriaDisciplinaId?: number;
  monto: number;
  descuentoSocioPorcentaje?: number;
  periodoAplicacion?: string;
}

/** Payload de PATCH /cuotas/:id. */
export interface ActualizarCuotaDto {
  monto?: number;
  descuentoSocioPorcentaje?: number;
  activo?: boolean;
}

/** Parámetros del listado de tarifas (filtros + paginación). */
export interface CuotasQuery {
  disciplinaId?: number;
  categoriaDisciplinaId?: number;
  periodoAplicacion?: string;
  pagina?: number;
  porPagina?: number;
}
