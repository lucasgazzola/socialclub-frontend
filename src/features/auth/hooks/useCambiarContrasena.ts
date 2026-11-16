import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api';
import type { CambiarContrasenaPayload } from '../types';

/**
 * US-41: Hook de mutación para que el usuario autenticado cambie su propia
 * contraseña. El formulario cierra la sesión local y redirige al login tras
 * el éxito, así que acá no se invalida ninguna caché.
 */
export function useCambiarContrasena() {
  return useMutation({
    mutationFn: (payload: CambiarContrasenaPayload) => authApi.cambiarContrasena(payload),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ocurrió un error al cambiar la contraseña. Intentá nuevamente.');
    },
  });
}
