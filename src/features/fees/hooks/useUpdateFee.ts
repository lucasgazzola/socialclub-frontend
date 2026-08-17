import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotasApi } from '../api/fees.api';
import type { UpdateFeeDto } from '../types';
import { cuotasKeys } from './fees.keys';

export function useUpdateFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateFeeDto }) =>
      cuotasApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuotasKeys.all });
      toast.success('Cuota actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la cuota');
    },
  });
}
