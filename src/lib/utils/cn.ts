import clsx, { type ClassValue } from 'clsx';

/**
 * Combina clases condicionales de forma segura. Útil para componer las
 * variantes de los componentes del design system.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
