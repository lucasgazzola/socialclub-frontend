import { useState } from 'react';
import { PortalButton, PortalModal } from '@/features/portal-socio/components/PortalUI';
import type { TipoDocumentacionDisciplina } from '@/features/disciplinas/types';
import type { DocumentoRequeridoCatalogo, SolicitudInscripcion } from '../types';
import {
  DocumentacionSolicitudFields,
  type DocumentosSolicitudValues,
} from './DocumentacionSolicitudFields';

interface Props {
  solicitud: SolicitudInscripcion | null;
  onClose: () => void;
  onSubmit: (
    solicitudId: number,
    payload: { tipoDocumento: TipoDocumentacionDisciplina; fechaVencimiento?: string },
    archivo: File,
  ) => Promise<unknown>;
  documentos?: DocumentoRequeridoCatalogo[];
}

export function SubirDocumentacionSolicitudModal({
  solicitud,
  onClose,
  onSubmit,
  documentos = [],
}: Props) {
  const [documentosSeleccionados, setDocumentosSeleccionados] =
    useState<DocumentosSolicitudValues>({});
  const [enviando, setEnviando] = useState(false);

  if (!solicitud) return null;

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    const seleccionados = documentos
      .map((documento) => ({
        documento,
        valor: documentosSeleccionados[documento.tipoDocumento],
      }))
      .filter(({ valor }) => valor?.archivo);
    if (seleccionados.length === 0) return;
    setEnviando(true);
    try {
      await Promise.all(
        seleccionados.map(({ documento, valor }) =>
          onSubmit(
            solicitud.id,
            {
              tipoDocumento: documento.tipoDocumento,
              ...(valor?.fechaVencimiento
                ? { fechaVencimiento: valor.fechaVencimiento }
                : {}),
            },
            valor!.archivo!,
          ),
        ),
      );
      onClose();
      setDocumentosSeleccionados({});
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PortalModal
      open
      title={`Adjuntar documentación · ${solicitud.disciplina.nombre}`}
      description="Podés enviar documentación obligatoria u opcional en PDF o imagen para revisión."
      onClose={enviando ? () => {} : onClose}
      size="sm"
    >
      <form className="space-y-4" onSubmit={enviar} data-testid="modal-documentacion-solicitud">
        <DocumentacionSolicitudFields
          documentos={documentos}
          valores={documentosSeleccionados}
          onChange={(tipoDocumento, cambio) =>
            setDocumentosSeleccionados((actuales) => ({
              ...actuales,
              [tipoDocumento]: {
                archivo: actuales[tipoDocumento]?.archivo ?? null,
                fechaVencimiento: actuales[tipoDocumento]?.fechaVencimiento ?? '',
                ...cambio,
              },
            }))
          }
        />
        <div className="flex justify-end gap-2">
          <PortalButton type="button" variant="secondary" size="sm" onClick={onClose} disabled={enviando}>
            Volver
          </PortalButton>
          <PortalButton
            type="submit"
            size="sm"
            disabled={
              enviando ||
              !documentos.some((documento) => documentosSeleccionados[documento.tipoDocumento]?.archivo)
            }
          >
            {enviando ? 'Enviando...' : 'Enviar documentación'}
          </PortalButton>
        </div>
      </form>
    </PortalModal>
  );
}
