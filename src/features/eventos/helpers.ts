import type { Evento } from './types';

export type KeyEstadoVisual =
  | 'CANCELADO'
  | 'FINALIZADO'
  | 'EN_CURSO'
  | 'AGOTADO'
  | 'VENTA_PROXIMA'
  | 'VENTA_CERRADA'
  | 'DISPONIBLE'
  | 'ACCESO_LIBRE';

export interface EstadoVisualConfig {
  key: KeyEstadoVisual;
  label: string;
  badgeClass: string;
  opacidadChipEntradasReducida: boolean;
}

export const ESTADOS_VISUALES_CONFIG: Record<KeyEstadoVisual, EstadoVisualConfig> = {
  CANCELADO: {
    key: 'CANCELADO',
    label: 'Cancelado',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    opacidadChipEntradasReducida: true,
  },
  FINALIZADO: {
    key: 'FINALIZADO',
    label: 'Finalizado',
    badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
    opacidadChipEntradasReducida: true,
  },
  EN_CURSO: {
    key: 'EN_CURSO',
    label: 'En curso',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    opacidadChipEntradasReducida: false,
  },
  AGOTADO: {
    key: 'AGOTADO',
    label: 'Agotado',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    opacidadChipEntradasReducida: true,
  },
  VENTA_PROXIMA: {
    key: 'VENTA_PROXIMA',
    label: 'Venta próxima',
    badgeClass: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20',
    opacidadChipEntradasReducida: false,
  },
  VENTA_CERRADA: {
    key: 'VENTA_CERRADA',
    label: 'Venta cerrada',
    badgeClass: 'bg-slate-200 text-slate-800 ring-1 ring-slate-600/20',
    opacidadChipEntradasReducida: true,
  },
  DISPONIBLE: {
    key: 'DISPONIBLE',
    label: 'Disponible',
    badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    opacidadChipEntradasReducida: false,
  },
  ACCESO_LIBRE: {
    key: 'ACCESO_LIBRE',
    label: 'Acceso libre',
    badgeClass: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
    opacidadChipEntradasReducida: false,
  },
};

/**
 * Función pura que evalúa si un evento permite compra de entradas.
 * Renderiza el botón SOLO si requiereEntrada === true && estado === PUBLICADO && (entradasDisponibles === null || entradasDisponibles > 0).
 */
export function puedeComprar(
  evento: Pick<Evento, 'requiereEntrada' | 'estado' | 'entradasDisponibles'>,
): boolean {
  if (evento.requiereEntrada === false) {
    return false;
  }
  if (evento.estado !== 'PUBLICADO') {
    return false;
  }
  return evento.entradasDisponibles === null || (evento.entradasDisponibles ?? 0) > 0;
}

/**
 * Si se pueden comprar entradas ahora: lo de `puedeComprar` más el período de
 * venta, que es opcional (Task-E8). Misma regla que `EntradasService.comprar`:
 * sin inicio, la venta ya está abierta; sin fin, no cierra.
 */
export function ventaAbierta(
  evento: Pick<Evento, 'requiereEntrada' | 'estado' | 'entradasDisponibles' | 'inicioVenta' | 'finVenta'>,
  ahora: number = Date.now(),
): boolean {
  if (!puedeComprar(evento)) return false;
  if (evento.inicioVenta && ahora < Date.parse(evento.inicioVenta)) return false;
  if (evento.finVenta && ahora > Date.parse(evento.finVenta)) return false;
  return true;
}

/**
 * Si el evento no informa `fechaFin`, dura estas horas desde su inicio. Es la
 * misma regla que usa el backend para vencer las entradas (DT-33,
 * `src/eventos/fin-del-evento.ts`): así la tarjeta no muestra «Finalizado»
 * mientras las entradas todavía sirven en la puerta.
 */
export const DURACION_POR_DEFECTO_HORAS = 12;

/**
 * Función pura que calcula el estado visual de un evento.
 */
export function getEstadoVisual(evento: Evento, ahoraDate = new Date()): EstadoVisualConfig {
  if (evento.estado === 'CANCELADO') {
    return ESTADOS_VISUALES_CONFIG.CANCELADO;
  }

  const fechaEventoDate = new Date(evento.fechaEvento);
  const fechaFinDate = evento.fechaFin
    ? new Date(evento.fechaFin)
    : new Date(fechaEventoDate.getTime() + DURACION_POR_DEFECTO_HORAS * 60 * 60 * 1000);

  if (evento.estado === 'FINALIZADO' || ahoraDate > fechaFinDate) {
    return ESTADOS_VISUALES_CONFIG.FINALIZADO;
  }

  if (ahoraDate >= fechaEventoDate && ahoraDate <= fechaFinDate) {
    return ESTADOS_VISUALES_CONFIG.EN_CURSO;
  }

  // Si no requiere entrada, el estado restante es "Acceso libre"
  if (!evento.requiereEntrada) {
    return ESTADOS_VISUALES_CONFIG.ACCESO_LIBRE;
  }

  // Reglas exclusivas para requiereEntrada = true
  if (evento.entradasDisponibles === 0) {
    return ESTADOS_VISUALES_CONFIG.AGOTADO;
  }

  if (evento.inicioVenta) {
    const inicioVentaDate = new Date(evento.inicioVenta);
    if (ahoraDate < inicioVentaDate) {
      return ESTADOS_VISUALES_CONFIG.VENTA_PROXIMA;
    }
  }

  if (evento.finVenta) {
    const finVentaDate = new Date(evento.finVenta);
    if (ahoraDate > finVentaDate) {
      return ESTADOS_VISUALES_CONFIG.VENTA_CERRADA;
    }
  }

  return ESTADOS_VISUALES_CONFIG.DISPONIBLE;
}

/**
 * Formatea un número o string numérico a moneda es-AR ($1.500) o "Gratis".
 */
export function formatPrecio(precio: string | number): string {
  const num = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (isNaN(num) || num === 0) {
    return 'Gratis';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formatea el precio aplicable a un socio considerando el descuento de socio.
 */
export function formatPrecioSocio(precio: string | number, descuentoSocio = 0): string | null {
  if (descuentoSocio <= 0) return null;
  const num = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (isNaN(num) || num <= 0) return null;

  if (descuentoSocio === 100) {
    return 'Gratis para socios (100% OFF)';
  }

  const precioFinalSocio = Math.max(0, num * (1 - descuentoSocio / 100));
  const montoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precioFinalSocio);

  return `${montoFormateado} socios (${descuentoSocio}% OFF)`;
}

/**
 * Formatea una fecha ISO a formato es-AR "Sáb 12 oct, 18:00 hs".
 */
export function formatFechaEvento(fechaIso: string | Date | null | undefined): string {
  if (!fechaIso) return '';
  const d = typeof fechaIso === 'string' ? new Date(fechaIso) : fechaIso;
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let weekday = '';
  let day = '';
  let month = '';
  let hour = '';
  let minute = '';

  for (const p of parts) {
    if (p.type === 'weekday') weekday = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
  }

  const weekdayCap = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '') : '';
  const monthLower = month ? month.toLowerCase().replace('.', '') : '';

  return `${weekdayCap} ${day} ${monthLower}, ${hour}:${minute} hs`;
}
