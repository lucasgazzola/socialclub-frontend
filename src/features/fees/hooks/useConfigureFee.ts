import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotasApi } from '../api/fees.api';
import { cuotasKeys } from './fees.keys';

export function useConfigureFee() {
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
