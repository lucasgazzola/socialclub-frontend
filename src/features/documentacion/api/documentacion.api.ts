import { apiClient } from '@/lib/api/client';
import type { CrearDocumentacionPayload, Documentacion } from '../types';

export const documentacionApi = {
  async crear(payload: CrearDocumentacionPayload, archivo?: File | null): Promise<Documentacion> {
    // Se envía como multipart para poder adjuntar el archivo opcional (PDF/imagen).
    const form = new FormData();
    form.append('tipo', payload.tipo);
    form.append('fechaVencimiento', payload.fechaVencimiento);
    form.append('personaId', String(payload.personaId));
    if (archivo) form.append('archivo', archivo);
    const { data } = await apiClient.post<Documentacion>('/documentacion', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async listarPorPersona(personaId: number): Promise<Documentacion[]> {
    const { data } = await apiClient.get<Documentacion[]>(`/documentacion/persona/${personaId}`);
    return data;
  },
};
