import type { CuotasQuery } from '../types';

/** Claves de cache de react-query para el módulo de cuotas deportivas. */
export const cuotasKeys = {
  all: ['cuotas'] as const,
  list: (query: CuotasQuery) => [...cuotasKeys.all, 'list', query] as const,
};
