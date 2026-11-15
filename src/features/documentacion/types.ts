import type { TipoDocumentacionDisciplina } from '@/features/disciplinas/types';

/** Documento obligatorio de un participante (US-24). */
export interface Documentacion {
  id: number;
  tipo: string;
  /** Tipo del catálogo; null en documentos cargados antes del catálogo. */
  tipoDocumento: TipoDocumentacionDisciplina | null;
  fechaVencimiento: string | null;
  personaId: number;
  archivoNombre?: string | null;
  mimeType?: string | null;
  /** TASK-60: lo que sube el titular espera revisión; solo APROBADO cuenta para la habilitación. */
  estadoRevision?: EstadoRevisionDocumento;
  cargadoPorTitular?: boolean;
  motivoRechazo?: string | null;
  revisadoEn?: string | null;
  creadoEn: string;
}

export type EstadoRevisionDocumento = 'APROBADO' | 'PENDIENTE_REVISION' | 'RECHAZADO';

/** TASK-60: documento subido por un titular que espera revisión (bandeja del delegado). */
export interface DocumentoPendienteRevision extends Documentacion {
  persona: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string | null;
    inscripciones: { disciplina: { id: number; nombre: string } }[];
  };
}

/** TASK-60: lo que manda el titular desde Mi club (la persona sale de su sesión). */
export type SubirMiDocumentacionPayload = Omit<CrearDocumentacionPayload, 'personaId'>;

/** Payload para cargar un documento obligatorio. */
export interface CrearDocumentacionPayload {
  tipoDocumento: TipoDocumentacionDisciplina;
  fechaVencimiento?: string; // YYYY-MM-DD (opcional para DNI, DT-43)
  personaId: number;
}

/** US-28: payload para registrar la habilitación excepcional de una inscripción. */
export interface CrearHabilitacionExcepcionalPayload {
  motivo: string;
  dias: number;
}

/** US-28: habilitación excepcional registrada por un administrador. */
export interface HabilitacionExcepcional {
  id: number;
  inscripcionId: number;
  motivo: string;
  hasta: string;
  responsableId: number;
  responsable?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  creadoEn: string;
}

// ── Estado documental (US-25 · TASK-31) ──────────────────────────────

export type EstadoDocumento = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'FALTANTE';
export type EstadoHabilitacion = 'HABILITADO' | 'PENDIENTE' | 'BLOQUEADO';

export interface EstadoDeDocumento {
  tipoDocumento: TipoDocumentacionDisciplina;
  etiqueta: string;
  origen: 'DISCIPLINA' | 'CATEGORIA';
  plazoDiasTolerancia: number;
  estado: EstadoDocumento;
  documentoId: number | null;
  fechaVencimiento: string | null;
  fechaLimite: string | null;
}

export interface EstadoDeInscripcion {
  estado: EstadoHabilitacion;
  motivos: string[];
  documentos: EstadoDeDocumento[];
  habilitadoExcepcionalmenteHasta: string | null;
  yaHabilitadoExcepcionalmente?: boolean;
}

export interface EstadoDocumentalInscripcion extends EstadoDeInscripcion {
  inscripcionId: number;
  disciplina: { id: number; nombre: string };
  categoriaDisciplina: { id: number; nombre: string } | null;
}

export interface EstadoDocumentalPersona {
  personaId: number;
  estado: EstadoHabilitacion | null;
  inscripciones: EstadoDocumentalInscripcion[];
  tiposExigidos: { tipoDocumento: TipoDocumentacionDisciplina; etiqueta: string; documentoActualId: number | null }[];
}

/** US-26: alerta de documentación por vencer, vencida o pendiente de presentación. */
export type TipoAlertaDocumentacion =
  | 'POR_VENCER'
  | 'VENCIDO'
  | 'PRESENTACION_POR_VENCER'
  | 'PRESENTACION_VENCIDA';

export interface AlertaDocumentacion {
  clave: string;
  tipo: TipoAlertaDocumentacion;
  inscripcionId: number;
  personaId: number;
  /** "Apellido, Nombre". */
  participante: string;
  disciplina: string;
  categoria: string | null;
  tipoDocumento: TipoDocumentacionDisciplina;
  documento: string;
  /** Vencimiento del documento o fecha límite de presentación (ISO). */
  fecha: string;
  diasRestantes: number;
  mensaje: string;
}
