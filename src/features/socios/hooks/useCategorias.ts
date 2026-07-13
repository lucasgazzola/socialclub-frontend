import { useQuery } from '@tanstack/react-query';
import type { CategoriaSocio } from '../types';

const CATEGORIAS_KEY = ['categorias'] as const;

/**
 * Hook que obtiene el catálogo de categorías de socio.
 * NOTA: asume que existe un endpoint GET /categorias en el backend.
 * Ajustar la URL si el nombre real del recurso es distinto.
 */
export function useCategorias() {
  return useQuery({
    queryKey: CATEGORIAS_KEY,
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api/client');
      const { data } = await apiClient.get<CategoriaSocio[]>('/categorias');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
