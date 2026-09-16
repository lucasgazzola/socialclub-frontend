import { apiClient } from '@/lib/api/client';
import type {
  ActualizarDatosPersonaPayload,
  ActivacionParticipanteResultado,
  BajaParticipanteResultado,
  CrearInscripcionPayload,
  InscripcionCreada,
  Inscripcion,
  InscripcionesQuery,
  ParticipanteConDisciplinas,
  ParticipanteEncontrado,
  PersonaActualizada,
} from '../types';
import type { Paginated } from '@/types/api';

export async function buscarParticipantePorDni(dni: string): Promise<ParticipanteEncontrado> {
  const { data } = await apiClient.get<ParticipanteEncontrado>(`/personas/dni/${dni}`);
  return data;
}

export async function crearInscripcion(
  payload: CrearInscripcionPayload,
): Promise<InscripcionCreada> {
  const { data } = await apiClient.post<InscripcionCreada>('/inscripcion', payload);
  return data;
}

export async function getInscripcion(id: number): Promise<Inscripcion> {
  const { data } = await apiClient.get<Inscripcion>(`/inscripcion/${id}`);
  return data;
}

export async function getInscripcionesPorPersona(
  personaId: number,
  incluirBajas = false,
 ): Promise<Inscripcion[]> {
  const { data } = await apiClient.get<Inscripcion[]>(`/inscripcion/persona/${personaId}`, {
    params: { incluirBajas: incluirBajas || undefined },
  });
  return data;
}

/** US-06: editar los datos básicos de un participante sin inscripciones vigentes (US-07). */
export async function actualizarDatosPersona(
  personaId: number,
  payload: ActualizarDatosPersonaPayload,
 ): Promise<PersonaActualizada> {
  const { data } = await apiClient.patch<PersonaActualizada>(`/personas/${personaId}`, payload);
  return data;
}

export async function actualizarInscripcion(
  id: number,
  payload: CrearInscripcionPayload,
): Promise<InscripcionCreada> {
  const { data } = await apiClient.patch<InscripcionCreada>(`/inscripcion/${id}`, payload);
  return data;
}

export async function listarInscripciones(
  query: InscripcionesQuery = {},
): Promise<Paginated<ParticipanteConDisciplinas>> {
  const { data } = await apiClient.get<Paginated<ParticipanteConDisciplinas>>('/inscripcion', {
    params: {
      busqueda: query.busqueda || undefined,
      disciplinaId: query.disciplinaId || undefined,
      estado: query.estado || undefined,
      pagina: query.pagina,
      porPagina: query.porPagina,
    },
  });
  return data;
}

/** US-07: dar de baja a un participante (baja lógica en todas sus disciplinas). */
export async function darDeBajaParticipante(
  personaId: number,
): Promise<BajaParticipanteResultado> {
  const { data } = await apiClient.delete<BajaParticipanteResultado>(
    `/inscripcion/persona/${personaId}`,
  );
  return data;
}

/** US-07: reactivar a un participante dado de baja. */
export async function activarParticipante(
  personaId: number,
): Promise<ActivacionParticipanteResultado> {
  const { data } = await apiClient.patch<ActivacionParticipanteResultado>(
    `/inscripcion/persona/${personaId}/activar`,
  );
  return data;
}
