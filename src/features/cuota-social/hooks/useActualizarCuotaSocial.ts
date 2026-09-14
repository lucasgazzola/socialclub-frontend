import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cuotaSocialApi } from '../api/cuota-social.api';
import type { ActualizarCuotaSocialDto } from '../types';
import { cuotaSocialKeys } from './cuota-social.keys';

export function useActualizarCuotaSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCuotaSocialDto }) =>
      cuotaSocialApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuotaSocialKeys.all });
      toast.success('Cuota social actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la cuota social');
    },
  });
}
