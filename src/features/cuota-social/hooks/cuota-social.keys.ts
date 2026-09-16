import type { CuotaSocialQuery } from '../types';

/** Claves de cache de react-query para cuota social (US16). */
export const cuotaSocialKeys = {
  all: ['cuota-social'] as const,
  list: (query: CuotaSocialQuery) => [...cuotaSocialKeys.all, 'list', query] as const,
};
