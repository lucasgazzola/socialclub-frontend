import { useQuery } from '@tanstack/react-query';
import { disciplinasApi } from '../api/disciplinas.api';

const DISCIPLINAS_KEY = ['disciplinas'] as const;

/**
 * Catálogo de disciplinas deportivas, usado para los selectores de la pantalla
 * de cuotas (datos reales del backend, no hardcodeados).
 */
export function useDisciplinas() {
  return useQuery({
    queryKey: DISCIPLINAS_KEY,
    queryFn: () => disciplinasApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}
