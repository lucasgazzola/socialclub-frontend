import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosApi } from '../api/users.api';
import { usuariosKeys } from './users.keys';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof usuariosApi.update>[1];
    }) => usuariosApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      toast.success('Usuario actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el usuario');
    },
  });
}