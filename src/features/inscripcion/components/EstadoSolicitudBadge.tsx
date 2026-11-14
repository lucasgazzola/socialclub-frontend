import { Badge, type BadgeVariant } from '@/components/ui';
import type { EstadoSolicitudInscripcion } from '../types';

interface Props {
  estado: EstadoSolicitudInscripcion;
  className?: string;
}

const CONFIG: Record<EstadoSolicitudInscripcion, { label: string; variant: BadgeVariant }> = {
  PENDIENTE: { label: 'En revisión', variant: 'warning' },
  PENDIENTE_DOCUMENTACION: { label: 'Pendiente de documentación', variant: 'warning' },
  APROBADA: { label: 'Aprobada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },
  CANCELADA: { label: 'Cancelada', variant: 'secondary' },
};

export function EstadoSolicitudBadge({ estado, className }: Props) {
  const conf = CONFIG[estado] ?? { label: estado, variant: 'secondary' };
  return (
    <Badge variant={conf.variant} className={className} data-testid={`badge-estado-${estado.toLowerCase()}`}>
      {conf.label}
    </Badge>
  );
}

