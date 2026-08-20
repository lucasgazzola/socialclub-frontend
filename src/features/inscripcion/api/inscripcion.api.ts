import { apiClient } from '@/lib/api/client';
import type { CrearInscripcionPayload, InscripcionCreada, ParticipanteEncontrado } from '../types';

export async function buscarParticipantePorDni(dni: string): Promise<ParticipanteEncontrado> {
  const { data } = await apiClient.get<ParticipanteEncontrado>(`/personas/dni/${dni}`);
  return data;
}

export async function crearInscripcion(payload: CrearInscripcionPayload): Promise<InscripcionCreada> {
  const { data } = await apiClient.post<InscripcionCreada>('/inscripcion', payload);
  return data;
}