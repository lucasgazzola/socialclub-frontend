/**
 * TASK-60 — Recuerda a qué pantalla volver después de ingresar (p. ej. el alta
 * de socio que empezó en la landing). Se guarda en el navegador porque la
 * verificación del email suele abrirse en otra pestaña. Es solo una
 * comodidad: si el almacenamiento no está disponible, se ignora.
 */
const CLAVE = 'sc-volver-a';
const VIGENCIA_MS = 24 * 60 * 60 * 1000;

export function recordarVolverA(ruta: string): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ruta, hasta: Date.now() + VIGENCIA_MS }));
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

/** Devuelve la ruta guardada (una sola vez) si sigue vigente y es interna. */
export function consumirVolverA(): string | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    localStorage.removeItem(CLAVE);
    if (!crudo) return null;
    const { ruta, hasta } = JSON.parse(crudo) as { ruta?: unknown; hasta?: unknown };
    if (typeof ruta !== 'string' || typeof hasta !== 'number' || hasta < Date.now()) return null;
    return ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : null;
  } catch {
    return null;
  }
}
