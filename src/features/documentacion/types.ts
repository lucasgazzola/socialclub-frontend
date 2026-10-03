import type { TipoDocumentacionDisciplina } from '@/features/disciplinas/types';

/** Documento obligatorio de un participante (US-24). */
export interface Documentacion {
  id: number;
  tipo: string;
  /** Tipo del catálogo; null en documentos cargados antes del catálogo. */
  tipoDocumento: TipoDocumentacionDisciplina | null;
  fechaVencimiento: string;
  personaId: number;
  archivoNombre?: string | null;
  mimeType?: string | null;
  creadoEn: string;
}

/** Payload para cargar un documento obligatorio. */
export interface CrearDocumentacionPayload {
  tipoDocumento: TipoDocumentacionDisciplina;
  fechaVencimiento: string; // YYYY-MM-DD
  personaId: number;
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
