import type { FeesQuery } from '../types';

/** Claves de cache de react-query para el módulo de cuotas deportivas. */
export const cuotasKeys = {
  all: ['cuotas'] as const,
  list: (query: FeesQuery) => [...cuotasKeys.all, 'list', query] as const,
};
