import { twMerge } from 'tailwind-merge';
import clsx, { type ClassValue } from 'clsx';

/**
 * Combina clases condicionales y, si dos utilidades de Tailwind pisan el
 * mismo grupo, se queda con la última. Sin eso, un `className` de color
 * pierde contra la variante del botón (el «Dar de baja» se veía gris).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
