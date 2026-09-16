import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sociosApi } from '../api/socios.api';
import { sociosKeys } from './useSocios';

export function useDesactivarSocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sociosApi.deactivate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sociosKeys.all });
    },
  });
}