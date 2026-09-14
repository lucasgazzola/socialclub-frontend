import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotaSocialApi } from '../api/cuota-social.api';
import { cuotaSocialKeys } from './cuota-social.keys';

export function useConfigurarCuotaSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cuotaSocialApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuotaSocialKeys.all });
      toast.success('Cuota social configurada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al configurar la cuota social');
    },
  });
}
