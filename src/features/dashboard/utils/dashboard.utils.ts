import type { BadgeVariant } from '@/components/ui';

export const ZONA_HORARIA_CORDOBA = 'America/Argentina/Cordoba';

/**
 * Umbrales del semáforo de morosidad (US-34 · Sección 7.6):
 * - Verde: < 15 %
 * - Amarillo: 15 % a 30 % (inclusive)
 * - Rojo: > 30 %
 */
export const UMBRALES_MOROSIDAD = {
  AMARILLO_DESDE: 15,
  ROJO_DESDE: 30,
} as const;

export type NivelMorosidad = 'verde' | 'amarillo' | 'rojo';

export interface InfoSemaforoMorosidad {
  nivel: NivelMorosidad;
  etiqueta: string;
  varianteBadge: BadgeVariant;
  clasePunto: string;
}

export function obtenerSemaforoMorosidad(porcentaje: number): InfoSemaforoMorosidad {
  if (porcentaje < UMBRALES_MOROSIDAD.AMARILLO_DESDE) {
    return {
      nivel: 'verde',
      etiqueta: 'Normal',
      varianteBadge: 'success',
      clasePunto: 'bg-emerald-500',
    };
  }
  if (porcentaje <= UMBRALES_MOROSIDAD.ROJO_DESDE) {
    return {
      nivel: 'amarillo',
      etiqueta: 'Moderado',
      varianteBadge: 'warning',
      clasePunto: 'bg-amber-500',
    };
  }
  return {
    nivel: 'rojo',
    etiqueta: 'Crítico',
    varianteBadge: 'danger',
    clasePunto: 'bg-rose-500',
  };
}

/**
 * Formatea el porcentaje de morosidad siempre con 1 decimal (ej. 0 -> "0.0%").
 */
export function formatearPorcentajeMorosos(porcentaje: number): string {
  const valorSeguro = Number.isFinite(porcentaje) ? porcentaje : 0;
  return `${valorSeguro.toFixed(1)}%`;
}

/**
 * Formatea una fecha ISO como "DD/MM/YYYY HH:mm" en la zona horaria America/Argentina/Cordoba.
 */
export function formatearFechaHoraEvento(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';

  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA_CORDOBA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha);

  const obtener = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? '00';

  return `${obtener('day')}/${obtener('month')}/${obtener('year')} ${obtener('hour')}:${obtener('minute')}`;
}

/**
 * Formatea un timestamp (ms) como "HH:mm" en la zona horaria America/Argentina/Cordoba.
 */
export function formatearHoraActualizacion(timestamp: number | undefined): string {
  if (!timestamp || timestamp <= 0) return '—';
  const fecha = new Date(timestamp);
  if (Number.isNaN(fecha.getTime())) return '—';

  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA_HORARIA_CORDOBA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha);

  const obtener = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? '00';

  return `${obtener('hour')}:${obtener('minute')}`;
}
