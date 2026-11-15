import type { Entrada, Evento } from '../types';

export type ClaveEstadoEntrada = 'VALIDA' | 'USADA' | 'VENCIDA' | 'CANCELADA';

/**
 * TASK-60 — Estado que ve el socio. La API ya devuelve EXPIRADA si el evento
 * terminó o se canceló; acá se distingue la cancelación para explicarla.
 */
export function claveEstadoEntrada(entrada: Entrada): ClaveEstadoEntrada {
  if (entrada.estado === 'USADA') return 'USADA';
  if (entrada.evento?.estado === 'CANCELADO') return 'CANCELADA';
  if (entrada.estado === 'EXPIRADA') return 'VENCIDA';
  return 'VALIDA';
}

export const esEntradaVigente = (entrada: Entrada) => claveEstadoEntrada(entrada) === 'VALIDA';

const FORMATO_FECHA_HORA: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatearFechaHora(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', FORMATO_FECHA_HORA);
}

/** Texto que acompaña al estado: cuándo se usó o por qué venció. */
export function detalleEstadoEntrada(entrada: Entrada): string {
  switch (claveEstadoEntrada(entrada)) {
    case 'USADA':
      return entrada.usadaEn ? `Usada el ${formatearFechaHora(entrada.usadaEn)}` : 'Ya se usó para ingresar';
    case 'CANCELADA':
      return 'El evento fue cancelado';
    case 'VENCIDA':
      return 'El evento ya terminó';
    default:
      return 'Lista para presentar en la puerta';
  }
}

export interface GrupoDeEntradas {
  eventoId: number;
  evento?: Evento;
  entradas: Entrada[];
}

/** Agrupa las entradas por evento respetando el orden en que llegan. */
export function agruparPorEvento(entradas: Entrada[]): GrupoDeEntradas[] {
  const grupos = new Map<number, GrupoDeEntradas>();
  for (const entrada of entradas) {
    const grupo = grupos.get(entrada.eventoId);
    if (grupo) grupo.entradas.push(entrada);
    else grupos.set(entrada.eventoId, { eventoId: entrada.eventoId, evento: entrada.evento, entradas: [entrada] });
  }
  return [...grupos.values()];
}

/** Texto del sello que se superpone al QR de una entrada que ya no sirve. */
export const SELLO_ESTADO: Record<Exclude<ClaveEstadoEntrada, 'VALIDA'>, string> = {
  USADA: 'USADA',
  VENCIDA: 'VENCIDA',
  CANCELADA: 'CANCELADA',
};
