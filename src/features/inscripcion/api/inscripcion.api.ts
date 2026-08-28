import { apiClient } from '@/lib/api/client';
import type { CrearInscripcionPayload, InscripcionCreada, Inscripcion, InscripcionesQuery, ParticipanteEncontrado } from '../types';
import type { Paginated } from '@/types/api';

export async function buscarParticipantePorDni(dni: string): Promise<ParticipanteEncontrado> {
  const { data } = await apiClient.get<ParticipanteEncontrado>(`/personas/dni/${dni}`);
  return data;
}

export async function crearInscripcion(payload: CrearInscripcionPayload): Promise<InscripcionCreada> {
  const { data } = await apiClient.post<InscripcionCreada>('/inscripcion', payload);
  return data;
}

export async function getInscripcion(id: number): Promise<Inscripcion> {
  const { data } = await apiClient.get<Inscripcion>(`/inscripcion/${id}`);
  return data;
}

export async function getInscripcionesPorPersona(personaId: number): Promise<Inscripcion[]> {
  const { data } = await apiClient.get<Inscripcion[]>(`/inscripcion/persona/${personaId}`);
  return data;
}

export async function actualizarInscripcion(id: number, payload: CrearInscripcionPayload): Promise<InscripcionCreada> {
  const { data } = await apiClient.patch<InscripcionCreada>(`/inscripcion/${id}`, payload);
  return data;
}

export async function listarInscripciones(query: InscripcionesQuery = {}): Promise<Paginated<Inscripcion>> {
  const { data } = await apiClient.get<Paginated<Inscripcion>>('/inscripcion', {
    params: {
      busqueda: query.busqueda || undefined,
      pagina: query.pagina,
      porPagina: query.porPagina,
    },
  });
  return data;
}