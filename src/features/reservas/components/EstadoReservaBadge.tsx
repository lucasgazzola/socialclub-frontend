import { Badge, type BadgeVariant } from '@/components/ui';
import { ETIQUETA_ESTADO_RESERVA, type EstadoReserva } from '../types';

const VARIANTE: Record<EstadoReserva, BadgeVariant> = {
  PENDIENTE_APROBACION: 'brand',
  APROBADA_PENDIENTE_PAGO: 'warning',
  CONFIRMADA: 'success',
  RECHAZADA: 'danger',
  CANCELADA_USUARIO: 'secondary',
  CANCELADA_FALTA_PAGO: 'secondary',
  CANCELADA_INSTITUCION: 'danger',
};

/** US-62: estado de una reserva, identificable de un vistazo. */
export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  return (
    <Badge variant={VARIANTE[estado]} className="whitespace-nowrap">
      {ETIQUETA_ESTADO_RESERVA[estado]}
    </Badge>
  );
}
