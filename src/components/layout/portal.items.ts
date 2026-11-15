import {
  CalendarClock,
  CreditCard,
  Dumbbell,
  Home,
  Ticket,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/routes/paths';

export interface ItemPortal {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Ruta exacta (sin marcar activo en las subrutas). */
  end?: boolean;
}

/**
 * TASK-60 — Secciones del portal, una por responsabilidad. Quien no es ni fue
 * socio ve «Asociate» en lugar de «Cuotas».
 */
export function itemsDelPortal(esOFueSocio: boolean): ItemPortal[] {
  return [
    { to: ROUTES.miClub, label: 'Inicio', icon: Home, end: true },
    { to: ROUTES.misEntradas, label: 'Entradas', icon: Ticket },
    esOFueSocio
      ? { to: ROUTES.misCuotas, label: 'Cuotas', icon: CreditCard }
      : { to: ROUTES.hacermeSocio, label: 'Asociate', icon: UserPlus },
    { to: ROUTES.misDisciplinas, label: 'Disciplinas', icon: Dumbbell },
    { to: ROUTES.misReservas, label: 'Reservas', icon: CalendarClock },
  ];
}
