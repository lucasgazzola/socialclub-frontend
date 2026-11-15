import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './users.keys';

/** DT-54: reenvía el enlace de verificación a un usuario pendiente. */
export function useReenviarVerificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usuariosApi.reenviarVerificacion(id),
    onSuccess: ({ mensaje }) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      toast.success(mensaje);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo reenviar el enlace');
    },
  });
}
