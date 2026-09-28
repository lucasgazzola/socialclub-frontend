import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sociosApi } from '../api/socios.api';
import { sociosKeys } from './useSocios';

export function useActivarSocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sociosApi.activate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sociosKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['cuotas-pendientes'] });
    },
  });
}
