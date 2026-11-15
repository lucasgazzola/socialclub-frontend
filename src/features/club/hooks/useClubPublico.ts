import { useQuery } from '@tanstack/react-query';
import { clubApi } from '../api/club.api';

export const CLUB_PUBLICO_KEY = ['club', 'publico'] as const;

/** TASK-60: datos públicos del club para la landing y el alta de socio. */
export function useClubPublico() {
  return useQuery({
    queryKey: CLUB_PUBLICO_KEY,
    queryFn: clubApi.informacionPublica,
    staleTime: 5 * 60 * 1000,
  });
}
