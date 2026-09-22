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
}

export interface DisciplinaOption {
  id: number;
  nombre: string;
  activo: boolean;
  categorias: CategoriaDisciplinaOption[];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type EstadoDisciplinaFiltro = 'ACTIVA' | 'INACTIVA';
