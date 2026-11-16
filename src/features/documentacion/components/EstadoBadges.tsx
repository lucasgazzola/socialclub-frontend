import { Badge, type BadgeVariant } from '@/components/ui';
import type { Documentacion, EstadoDocumento, EstadoHabilitacion } from '../types';

const HABILITACION: Record<EstadoHabilitacion, { texto: string; variante: BadgeVariant }> = {
  HABILITADO: { texto: 'Habilitado', variante: 'success' },
  PENDIENTE: { texto: 'Pendiente de documentación', variante: 'warning' },
  BLOQUEADO: { texto: 'Bloqueado', variante: 'danger' },
};

const DOCUMENTO: Record<EstadoDocumento, { texto: string; variante: BadgeVariant }> = {
  VIGENTE: { texto: 'Vigente', variante: 'success' },
  POR_VENCER: { texto: 'Por vencer', variante: 'warning' },
  VENCIDO: { texto: 'Vencido', variante: 'danger' },
  FALTANTE: { texto: 'Faltante', variante: 'secondary' },
};

/** US-25: estado general de una inscripción o de un participante. */
export function EstadoHabilitacionBadge({ estado, title }: { estado: EstadoHabilitacion; title?: string }) {
  const { texto, variante } = HABILITACION[estado];
  return (
    <Badge variant={variante} title={title}>
      {texto}
    </Badge>
  );
}

/** US-25: estado de un documento exigido. */
export function EstadoDocumentoBadge({ estado }: { estado: EstadoDocumento }) {
  const { texto, variante } = DOCUMENTO[estado];
  return <Badge variant={variante}>{texto}</Badge>;
}

/**
 * TASK-60: lo que subió el titular desde Mi club. Mientras está en revisión o
 * si fue rechazado no cuenta para la habilitación.
 */
export function EstadoRevisionBadge({ doc }: { doc: Pick<Documentacion, 'estadoRevision' | 'motivoRechazo'> }) {
  if (doc.estadoRevision === 'PENDIENTE_REVISION') {
    return (
      <Badge variant="warning" className="ml-2">
        En revisión
      </Badge>
    );
  }
  if (doc.estadoRevision === 'RECHAZADO') {
    return (
      <Badge variant="danger" className="ml-2" title={doc.motivoRechazo ?? undefined}>
        Rechazado
      </Badge>
    );
  }
  return null;
}
