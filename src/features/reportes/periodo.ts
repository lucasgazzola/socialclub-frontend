/**
 * US-35 — Períodos del reporte: un mes, un trimestre o un rango de meses.
 * Todo se expresa como rango "AAAA-MM" → "AAAA-MM" (inclusive).
 */

export type TipoPeriodo = 'mes' | 'trimestre' | 'rango';

export interface Rango {
  desde: string;
  hasta: string;
}

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const aPeriodo = (anio: number, mes: number) => `${anio}-${String(mes).padStart(2, '0')}`;

/** Trimestre (1 a 4) de un mes (1 a 12). */
export const trimestreDe = (mes: number) => Math.ceil(mes / 3);

export function rangoDeTrimestre(anio: number, trimestre: number): Rango {
  const inicio = (trimestre - 1) * 3 + 1;
  return { desde: aPeriodo(anio, inicio), hasta: aPeriodo(anio, inicio + 2) };
}

/** "2026-09" → "septiembre 2026". */
export function nombreDelMes(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}

/** "2026-09" → "sep 26", para ejes. */
export function mesCorto(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number);
  return `${MESES[mes - 1].slice(0, 3)} ${String(anio).slice(2)}`;
}

/** Descripción legible de un rango. */
export function describirRango({ desde, hasta }: Rango): string {
  const texto =
    desde === hasta ? nombreDelMes(desde) : `${nombreDelMes(desde)} a ${nombreDelMes(hasta)}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Años que ofrece el selector: desde 2025 hasta el actual. */
export function aniosDisponibles(hoy = new Date()): number[] {
  const actual = hoy.getFullYear();
  return Array.from({ length: actual - 2025 + 1 }, (_, i) => actual - i);
}
