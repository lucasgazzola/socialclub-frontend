/** Catálogo de disciplinas deportivas expuesto por GET /disciplines. */
export interface Discipline {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** Categoría de socio (catálogo de GET /categories). */
export interface MemberCategory {
  id: number;
  name: string;
  description?: string | null;
}

/** Configuración de cuota deportiva por disciplina-categoría-período. */
export interface SportsFeeConfig {
  id: number;
  disciplineId: number;
  categoryId: number;
  appliedPeriod: string;
  amount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  discipline: Discipline;
  category: MemberCategory;
}

/** Payload de POST /fees (crea o actualiza la combinación+período). */
export interface ConfigureFeeDto {
  disciplineId: number;
  categoryId: number;
  amount: number;
  appliedPeriod?: string;
}

/** Payload de PATCH /fees/:id (solo monto/estado). */
export interface UpdateFeeDto {
  amount?: number;
  active?: boolean;
}

/** Parámetros del listado de cuotas (filtros + paginación). */
export interface FeesQuery {
  disciplineId?: number;
  categoryId?: number;
  appliedPeriod?: string;
  page?: number;
  perPage?: number;
}
