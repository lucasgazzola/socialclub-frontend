/** Documento obligatorio de un participante (US-24). */
export interface Documentacion {
  id: number;
  tipo: string;
  fechaVencimiento: string;
  personaId: number;
  archivoNombre?: string | null;
  mimeType?: string | null;
  creadoEn: string;
}

/** Payload para cargar un documento obligatorio. */
export interface CrearDocumentacionPayload {
  tipo: string;
  fechaVencimiento: string; // YYYY-MM-DD
  personaId: number;
}
