/**
 * Tipos de dominio del feature de Inscripción: los shapes que viajan por
 * la API (requests y responses) y los datos que consumen los hooks y
 * componentes.
 *
 * Los tipos de formulario (`InscripcionFormValues`) NO están acá: viven en
 * `schema/inscripcion.schema.ts`, porque nacen del schema de Zod (con sus
 * reglas de validación) y no de un contrato HTTP. Son estructuralmente
 * parecidos a `CrearInscripcionPayload` hoy, pero se mantienen separados a
 * propósito: el form puede terminar necesitando campos que no correspondan
 * enviar tal cual a la API (ej. un "confirmar email"), y no queremos que
 * ese acoplamiento se filtre en el contrato del backend.
 */

// ── Persona / participante ──────────────────────────────────────────

export interface InscripcionResumida {
  id: number;
  disciplina: { id: number; nombre: string };
  categoriaDisciplina: { id: number; nombre: string } | null;
}

export interface ParticipanteEncontrado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  inscripciones: InscripcionResumida[];
}

export interface CrearInscripcionPayload {
  personaId?: number;
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaNacimiento?: string;
  email?: string;
  telefono?: string;
  disciplinaId: number;
  categoriaDisciplinaId?: number;
}

export interface InscripcionCreada {
  persona: { id: number; nombre: string; apellido: string; dni: string };
  inscripcion: { id: number; disciplinaId: number; categoriaDisciplinaId: number | null };
}

export interface Inscripcion {
  id: number;
  personaId: number;
  persona: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string | null;
    email: string | null;
    telefono: string | null;
    /** US-07: estado propio del participante (Inactivo = dado de baja). */
    activo: boolean;
  };
  disciplinaId: number;
  disciplina: { id: number; nombre: string };
  categoriaDisciplinaId: number | null;
  categoriaDisciplina: { id: number; nombre: string } | null;
  fechaInscripcion: string;
  activo: boolean;
  /** Estado legible que expone el listado de participantes (US-08). */
  estado?: EstadoInscripcionFiltro;
}

/** Una disciplina (inscripción) dentro del detalle de un participante (US-08). */
export interface DisciplinaInscripta {
  inscripcionId: number;
  disciplinaId: number;
  disciplina: { id: number; nombre: string };
  categoriaDisciplinaId: number | null;
  categoriaDisciplina: { id: number; nombre: string } | null;
  fechaInscripcion: string;
  activo: boolean;
  /** Estado legible de la inscripción en esta disciplina. */
  estado: EstadoInscripcionFiltro;
}

/**
 * Fila del listado de participantes (US-08): una fila por participante con
 * todas sus disciplinas. El estado agregado es INSCRIPTO si tiene al menos
 * una inscripción activa, BAJA en caso contrario.
 */
export interface ParticipanteConDisciplinas {
  personaId: number;
  persona: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string | null;
    email: string | null;
    telefono: string | null;
    /** US-07: estado propio del participante (Inactivo = dado de baja). */
    activo: boolean;
  };
  disciplinas: DisciplinaInscripta[];
  cantidadDisciplinas: number;
  estado: EstadoInscripcionFiltro;
}

/** Estado de la participación de un participante en una disciplina. */
export type EstadoInscripcionFiltro = 'INSCRIPTO' | 'BAJA';

/** Parámetros del listado de participantes (US-08: búsqueda, filtros + paginación). */
export interface InscripcionesQuery {
  busqueda?: string;
  disciplinaId?: number;
  estado?: EstadoInscripcionFiltro;
  pagina?: number;
  porPagina?: number;
}

/** Disciplina de la que se dio de baja al participante (US-07). */
export interface DisciplinaDadaDeBaja {
  inscripcionId: number;
  disciplinaId: number;
  disciplina: string;
}

/**
 * Resultado de dar de baja a un participante (US-07): el participante queda
 * Inactivo y sin disciplinas vigentes.
 */
export interface BajaParticipanteResultado {
  personaId: number;
  activo: boolean;
  disciplinasDadasDeBaja: number;
  disciplinas: DisciplinaDadaDeBaja[];
}

/** Resultado de reactivar a un participante dado de baja (US-07). */
export interface ActivacionParticipanteResultado {
  personaId: number;
  activo: boolean;
}
/** US-06: edición de los datos básicos de un participante sin inscripciones vigentes (US-07). */
export interface ActualizarDatosPersonaPayload {
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaNacimiento?: string;
  email?: string;
  telefono?: string;
}

/** Respuesta de PATCH /personas/:id. */
export interface PersonaActualizada {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  activo: boolean;
}
