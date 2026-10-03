import { apiClient } from '@/lib/api/client';
import type {
  AlertaDocumentacion,
  CrearDocumentacionPayload,
  Documentacion,
  EstadoDocumentalPersona,
} from '../types';

export const documentacionApi = {
  async crear(payload: CrearDocumentacionPayload, archivo?: File | null): Promise<Documentacion> {
    // Se envía como multipart para poder adjuntar el archivo opcional (PDF/imagen).
    const form = new FormData();
    form.append('tipoDocumento', payload.tipoDocumento);
    form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('personaId', String(payload.personaId));
    if (archivo) form.append('archivo', archivo);
    const { data } = await apiClient.post<Documentacion>('/documentacion', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** US-25: exigido vs. presentado, por cada inscripción activa. */
  async estadoPorPersona(personaId: number): Promise<EstadoDocumentalPersona> {
    const { data } = await apiClient.get<EstadoDocumentalPersona>(`/documentacion/persona/${personaId}/estado`);
    return data;
  },

  async listarPorPersona(personaId: number): Promise<Documentacion[]> {
    const { data } = await apiClient.get<Documentacion[]>(`/documentacion/persona/${personaId}`);
    return data;
  },

  /** US-26: alertas de documentación de los próximos 10 días y lo ya vencido. */
  async alertas(): Promise<AlertaDocumentacion[]> {
    const { data } = await apiClient.get<AlertaDocumentacion[]>('/alertas/documentacion');
    return data;
  },
};
