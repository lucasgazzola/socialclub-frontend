import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotasApi } from '../api/cuotas.api';
import type { ActualizarCuotaDto } from '../types';
import { cuotasKeys } from './cuotas.keys';

export function useActualizarCuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCuotaDto }) =>
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
