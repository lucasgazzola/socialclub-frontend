import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';

export function useDeactivateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usuariosApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      toast.success('Usuario deshabilitado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al deshabilitar el usuario');
    },
  });
}