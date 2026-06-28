import { useQuery } from '@tanstack/react-query';
import { sociosApi } from '../api/socios.api';
import type { SociosQuery } from '../types';

/** Claves de cache de react-query para el módulo de socios. */
export const sociosKeys = {
  all: ['socios'] as const,
  list: (query: SociosQuery) => [...sociosKeys.all, 'list', query] as const,
};

/**
 * Hook de datos de socios. Encapsula react-query para que las páginas/componentes
 * no conozcan los detalles del cache ni del fetching.
 */
export function useSocios(query: SociosQuery) {
  return useQuery({
    queryKey: sociosKeys.list(query),
    queryFn: () => sociosApi.list(query),
  });
}
