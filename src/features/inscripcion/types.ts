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
