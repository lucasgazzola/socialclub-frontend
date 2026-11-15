/**
 * DT-54 — El email se escribe dos veces al cargarlo, por si la persona se
 * equivoca. Se compara como lo guarda la API: sin espacios en los extremos y
 * sin distinguir mayúsculas.
 */
export function normalizarEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function mismoEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizarEmail(a) === normalizarEmail(b);
}

export const MENSAJE_EMAILS_DISTINTOS = 'Los emails no coinciden';
export const MENSAJE_CONFIRMAR_EMAIL = 'Confirmá el email';

/**
 * Regla común para los formularios con email: si hay email, la confirmación
 * es obligatoria y tiene que coincidir. Devuelve el mensaje de error o null.
 */
export function errorConfirmacionEmail(
  email: string | null | undefined,
  confirmarEmail: string | null | undefined,
): string | null {
  if (!normalizarEmail(email)) return null;
  if (!normalizarEmail(confirmarEmail)) return MENSAJE_CONFIRMAR_EMAIL;
  return mismoEmail(email, confirmarEmail) ? null : MENSAJE_EMAILS_DISTINTOS;
}
