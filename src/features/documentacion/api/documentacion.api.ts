import { apiClient } from '@/lib/api/client';
import type {
  AlertaDocumentacion,
  CrearDocumentacionPayload,
  Documentacion,
  DocumentoPendienteRevision,
  EstadoDocumentalPersona,
  SubirMiDocumentacionPayload,
} from '../types';

export const documentacionApi = {
  async crear(payload: CrearDocumentacionPayload, archivo?: File | null): Promise<Documentacion> {
    // Se envía como multipart para poder adjuntar el archivo opcional (PDF/imagen).
    const form = new FormData();
    form.append('tipoDocumento', payload.tipoDocumento);
    if (payload.fechaVencimiento) form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('personaId', String(payload.personaId));
    if (archivo) form.append('archivo', archivo);
    const { data } = await apiClient.post<Documentacion>('/documentacion', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** TASK-60: el titular sube su documento; queda en revisión. */
  async subirMiDocumentacion(payload: SubirMiDocumentacionPayload, archivo: File): Promise<Documentacion> {
    const form = new FormData();
    form.append('tipoDocumento', payload.tipoDocumento);
    if (payload.fechaVencimiento) form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('archivo', archivo);
    const { data } = await apiClient.post<Documentacion>('/documentacion/mi-documentacion', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** TASK-60: documentos que subieron los titulares y esperan revisión. */
  async pendientesRevision(): Promise<DocumentoPendienteRevision[]> {
    const { data } = await apiClient.get<DocumentoPendienteRevision[]>('/documentacion/pendientes-revision');
    return data;
  },

  async aprobar(id: number): Promise<Documentacion> {
    const { data } = await apiClient.patch<Documentacion>(`/documentacion/${id}/aprobar`);
    return data;
  },

  async rechazar(id: number, motivo: string): Promise<Documentacion> {
    const { data } = await apiClient.patch<Documentacion>(`/documentacion/${id}/rechazar`, { motivo });
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
