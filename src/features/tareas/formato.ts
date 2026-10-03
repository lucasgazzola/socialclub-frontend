import type { EjecucionTarea } from './types';

/** dd/mm/aaaa hh:mm en la hora local. */
export function fechaHora(iso: string): string {
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Quién la disparó: el horario programado o un usuario. */
export function origenDe(ejecucion: EjecucionTarea): string {
  if (ejecucion.origen === 'PROGRAMADA') return 'Programada';
  const u = ejecucion.usuario;
  return u ? `Manual · ${u.nombre} ${u.apellido}` : 'Manual';
}
