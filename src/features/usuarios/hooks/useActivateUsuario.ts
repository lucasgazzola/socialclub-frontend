import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosApi } from '../api/usuarios.api';

export function useActivateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usuariosApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario habilitado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear el usuario');
    },
  });
}
