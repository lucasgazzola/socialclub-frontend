/**
 * Fechas del producto: se muestran como dd/mm/aaaa y viajan a la API en ISO
 * (aaaa-mm-dd). DT-40: el input nativo toma el formato del idioma del
 * navegador, así que la conversión se hace acá y no en el navegador.
 */

/** "2026-10-01" → "01/10/2026". Devuelve "" si el ISO no es válido. */
export function isoADisplay(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** "01/10/2026" → "2026-10-01". Devuelve null si la fecha está incompleta o no existe (ej. 31/02). */
export function displayAIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  if (anio < 1000 || fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Aplica la máscara dd/mm/aaaa sobre lo que se escribe (solo dígitos, barras automáticas). */
export function enmascararFecha(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/**
 * "aaaa-mm-ddThh:mm" (fecha y hora locales, como `datetime-local` o
 * `DateTimeInput`) → instante ISO con zona. Sin esto, el servidor interpreta la
 * hora en su propia zona (UTC en Azure) y el evento queda corrido 3 horas.
 * Cualquier otro valor se devuelve igual.
 */
export function localAInstante<T extends string | null | undefined>(valor: T): T | string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return valor;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toISOString();
}

/** Máscara hh:mm (24 h): solo dígitos y los dos puntos automáticos. */
export function enmascararHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}
