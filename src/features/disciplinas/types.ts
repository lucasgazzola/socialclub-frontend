// ─── Enums ────────────────────────────────────────────────────────────────────

export type GeneroDisciplina = 'FEMENINO' | 'MASCULINO' | 'NO_BINARIO_NO_ESPECIFICADO';

export const GENERO_DISCIPLINA_LABELS: Record<GeneroDisciplina, string> = {
  FEMENINO: 'Femenino',
  MASCULINO: 'Masculino',
  NO_BINARIO_NO_ESPECIFICADO: 'No binario / No especificado',
};

export type TipoDocumentacionDisciplina =
  | 'DNI'
  | 'FICHA_INSCRIPCION'
  | 'CERTIFICADO_MEDICO_APTITUD_FISICA'
  | 'SEGURO_COBERTURA_MEDICA'
  | 'AUTORIZACION_PADRES_TUTORES'
  | 'CARNET_FEDERATIVO_LICENCIA_DEPORTIVA'
  | 'REGLAMENTO_INTERNO_FIRMADO'
  | 'FICHA_TECNICA_NATACION'
  | 'FICHA_TECNICA_GIMNASIO_FITNESS'
  | 'FICHA_TECNICA_ARTES_MARCIALES'
  | 'FICHA_TECNICA_DEPORTES_CONTACTO'
  | 'COMPROBANTE_PAGO_CUOTA_SOCIAL_DEPORTIVA';

export const TIPOS_DOCUMENTACION_DISCIPLINA: Array<{ value: TipoDocumentacionDisciplina; label: string }> = [
  { value: 'DNI', label: 'DNI' },
  { value: 'FICHA_INSCRIPCION', label: 'Ficha de inscripción' },
  { value: 'CERTIFICADO_MEDICO_APTITUD_FISICA', label: 'Certificado médico de aptitud física' },
  { value: 'SEGURO_COBERTURA_MEDICA', label: 'Seguro o cobertura médica' },
  { value: 'AUTORIZACION_PADRES_TUTORES', label: 'Autorización de padres/tutores' },
  { value: 'CARNET_FEDERATIVO_LICENCIA_DEPORTIVA', label: 'Carnet federativo o licencia deportiva' },
  { value: 'REGLAMENTO_INTERNO_FIRMADO', label: 'Reglamento interno firmado' },
  { value: 'FICHA_TECNICA_NATACION', label: 'Ficha técnica: Natación' },
  { value: 'FICHA_TECNICA_GIMNASIO_FITNESS', label: 'Ficha técnica: Gimnasio/Fitness' },
  { value: 'FICHA_TECNICA_ARTES_MARCIALES', label: 'Ficha técnica: Artes marciales' },
  { value: 'FICHA_TECNICA_DEPORTES_CONTACTO', label: 'Ficha técnica: Deportes de contacto' },
  { value: 'COMPROBANTE_PAGO_CUOTA_SOCIAL_DEPORTIVA', label: 'Comprobante de pago de cuota social/deportiva' },
];

// ─── Modelos ──────────────────────────────────────────────────────────────────

export interface CategoriaDisciplina {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface RequerimientoDoc {
  id: number;
  tipoDocumento: TipoDocumentacionDisciplina;
  plazoDiasTolerancia: number;
}

/** Disciplina completa, con todos los campos del backend. */
export interface Disciplina {
  id: number;
  nombre: string;
  descripcion?: string | null;
  genero?: GeneroDisciplina | null;
  edadMinima?: number | null;
  edadMaxima?: number | null;
  solicitaDocumentacion: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  categorias: CategoriaDisciplina[];
  requerimientosDoc: RequerimientoDoc[];
}

export interface DisciplinasQuery {
  busqueda?: string;
  estado?: 'ACTIVA' | 'INACTIVA';
  pagina: number;
  porPagina: number;
}

export interface DisciplinasPaginadas {
  items: Disciplina[];
  total: number;
  pagina: number;
  porPagina: number;
  conteos: {
    todas: number;
    activas: number;
    inactivas: number;
  };
}

/** DTO para crear o editar una disciplina. */
export interface CreateDisciplinaPayload {
  nombre: string;
  descripcion?: string;
  genero?: GeneroDisciplina | null;
  edadMinima?: number | null;
  edadMaxima?: number | null;
  solicitaDocumentacion: boolean;
  activo: boolean;
  requerimientosDocumentacion?: Array<{
    tipoDocumento: TipoDocumentacionDisciplina;
    plazoDiasTolerancia: number;
  }>;
}

export type UpdateDisciplinaPayload = Partial<CreateDisciplinaPayload>;

/** Opción liviana para el selector de disciplina del flujo de inscripción. */
export interface CategoriaDisciplinaOption {
  id: number;
  nombre: string;
  activo: boolean;
  genero?: GeneroDisciplina | null;
  edadMinima?: number | null;
  edadMaxima?: number | null;
}

export interface DisciplinaOption {
  id: number;
  nombre: string;
  activo: boolean;
  genero?: GeneroDisciplina | null;
  edadMinima?: number | null;
  edadMaxima?: number | null;
  categorias: CategoriaDisciplinaOption[];
}

// ─── Categorías de disciplina (US-48 a US-51) ────────────────────────────────

export interface RequerimientoDocVigente extends RequerimientoDoc {
  /** Desde cuándo rige el requisito (base del plazo para los ya inscriptos). */
  creadoEn: string;
}

/**
 * Restricciones de inscripción. La edad es la que se cumple en el año
 * calendario (por año de nacimiento). En una categoría, null = hereda de la disciplina.
 */
export interface Restricciones {
  genero: GeneroDisciplina | null;
  edadMinima: number | null;
  edadMaxima: number | null;
}

/** Categoría con su documentación ADICIONAL y sus restricciones propias. */
export interface CategoriaDisciplinaDetalle extends Restricciones {
  id: number;
  disciplinaId: number;
  nombre: string;
  activo: boolean;
  creadoEn: string;
  requerimientosDoc: RequerimientoDocVigente[];
  _count: { inscripciones: number };
}

/** Listado de categorías junto con los requisitos de su disciplina. */
export interface CategoriasDeDisciplina {
  disciplina: Restricciones & {
    id: number;
    nombre: string;
    activo: boolean;
    solicitaDocumentacion: boolean;
    requerimientosDoc: RequerimientoDocVigente[];
  };
  items: CategoriaDisciplinaDetalle[];
}

export interface CategoriasQuery {
  busqueda?: string;
  estado?: EstadoDisciplinaFiltro;
}

export interface RequerimientoDocPayload {
  tipoDocumento: TipoDocumentacionDisciplina;
  plazoDiasTolerancia: number;
}

export interface CategoriaPayload extends Restricciones {
  nombre: string;
  requerimientosDocumentacion: RequerimientoDocPayload[];
}

export function etiquetaTipoDocumento(tipo: TipoDocumentacionDisciplina): string {
  return TIPOS_DOCUMENTACION_DISCIPLINA.find((opcion) => opcion.value === tipo)?.label ?? tipo;
}

/** Restricción que rige: la de la categoría si la define, si no la de la disciplina. */
export function restriccionesEfectivas(disciplina: Restricciones, categoria?: Restricciones | null): Restricciones {
  return {
    genero: categoria?.genero ?? disciplina.genero,
    edadMinima: categoria?.edadMinima ?? disciplina.edadMinima,
    edadMaxima: categoria?.edadMaxima ?? disciplina.edadMaxima,
  };
}

export function describirEdad({ edadMinima, edadMaxima }: Restricciones): string {
  if (edadMinima !== null && edadMaxima !== null) return edadMinima === edadMaxima ? `${edadMinima} años` : `${edadMinima} a ${edadMaxima} años`;
  if (edadMinima !== null) return `Desde ${edadMinima} años`;
  if (edadMaxima !== null) return `Hasta ${edadMaxima} años`;
  return 'Sin límite de edad';
}

/** Años de nacimiento que abarca el rango en la temporada indicada (ej. "Nacidos 2011–2013"). */
export function describirAniosNacimiento({ edadMinima, edadMaxima }: Restricciones, anio = new Date().getFullYear()): string | null {
  if (edadMinima !== null && edadMaxima !== null) {
    const desde = anio - edadMaxima;
    const hasta = anio - edadMinima;
    return desde === hasta ? `Nacidos en ${desde}` : `Nacidos ${desde}–${hasta}`;
  }
  if (edadMinima !== null) return `Nacidos hasta ${anio - edadMinima}`;
  if (edadMaxima !== null) return `Nacidos desde ${anio - edadMaxima}`;
  return null;
}

export function etiquetaPlazo(dias: number): string {
  return dias === 0 ? 'Obligatorio al inscribirse' : `${dias} días para presentarlo`;
}

/**
 * Verifica si un participante cumple con las restricciones efectivas de una categoría.
 * Solo devuelve true si el participante cumple los requisitos de género y edad de la categoría.
 */
export function categoriaCumpleRestricciones(
  categoria: CategoriaDisciplinaOption,
  disciplina?: { genero?: GeneroDisciplina | null; edadMinima?: number | null; edadMaxima?: number | null } | null,
  participante?: { fechaNacimiento?: string | null; genero?: GeneroDisciplina | null } | null,
  anio = new Date().getFullYear(),
): boolean {
  const generoEfectivo = categoria.genero ?? disciplina?.genero ?? null;
  const edadMinima = categoria.edadMinima ?? disciplina?.edadMinima ?? null;
  const edadMaxima = categoria.edadMaxima ?? disciplina?.edadMaxima ?? null;

  // 1. Requisito de género: si la categoría o disciplina restringe género
  if (generoEfectivo) {
    if (!participante?.genero || participante.genero !== generoEfectivo) {
      return false;
    }
  }

  // 2. Requisito de edad: si la categoría o disciplina restringe edad mínima o máxima
  if (edadMinima !== null || edadMaxima !== null) {
    if (!participante?.fechaNacimiento) {
      return false;
    }
    const soloAnio = parseInt(participante.fechaNacimiento.slice(0, 4), 10);
    if (isNaN(soloAnio)) {
      return false;
    }
    const edad = anio - soloAnio;
    if (edadMinima !== null && edad < edadMinima) return false;
    if (edadMaxima !== null && edad > edadMaxima) return false;
  }

  return true;
}

/**
 * US-50: una categoría dada de baja no se ofrece para nuevas inscripciones.
 * Si la inscripción ya estaba en una categoría inactiva, se la conserva en la
 * lista para no perderla al editar.
 * Además, solo aparecen las categorías cuyos requisitos son cumplidos por el participante.
 */
export function categoriasDisponibles(
  disciplina: { categorias: CategoriaDisciplinaOption[]; genero?: GeneroDisciplina | null; edadMinima?: number | null; edadMaxima?: number | null } | undefined,
  categoriaActualId?: number | null,
  participante?: { fechaNacimiento?: string | null; genero?: GeneroDisciplina | null } | null,
): CategoriaDisciplinaOption[] {
  const activas = (disciplina?.categorias ?? []).filter((c) => c.activo || c.id === categoriaActualId);
  return activas.filter(
    (c) => c.id === categoriaActualId || categoriaCumpleRestricciones(c, disciplina, participante),
  );
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type EstadoDisciplinaFiltro = 'ACTIVA' | 'INACTIVA';
