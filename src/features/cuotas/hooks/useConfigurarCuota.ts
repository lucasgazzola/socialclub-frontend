import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotasApi } from '../api/cuotas.api';
import { cuotasKeys } from './cuotas.keys';

export function useConfigurarCuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cuotasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuotasKeys.all });
      toast.success('Cuota configurada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al configurar la cuota');
    },
  });
}
