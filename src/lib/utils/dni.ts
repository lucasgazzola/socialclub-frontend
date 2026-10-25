/**
 * Formatea un número de DNI con separador de miles con puntos (ej. "25123456" -> "25.123.456").
 * Si no hay valor devuelve el texto de respaldo (por defecto '—').
 */
export function formatearDni(dni?: string | null, fallback = '—'): string {
  if (!dni) {
    return fallback;
  }
  const limpio = String(dni).trim();
  if (!limpio) {
    return fallback;
  }
  return /^\d+$/.test(limpio) ? Number(limpio).toLocaleString('es-AR') : limpio;
}
