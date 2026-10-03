import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotasApi } from '../api/cuotas.api';
import type { ActualizarCuotaDto } from '../types';
import { cuotasKeys } from './cuotas.keys';

export function useActualizarCuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCuotaDto; mensaje?: string }) =>
      cuotasApi.update(id, payload),
    onSuccess: (_cuota, { mensaje }) => {
      queryClient.invalidateQueries({ queryKey: cuotasKeys.all });
      toast.success(mensaje ?? 'Cuota actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la cuota');
    },
  });
}
