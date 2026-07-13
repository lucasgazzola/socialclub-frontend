import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api';
import { toast } from 'sonner';
import { usuariosKeys } from './users.keys';

export function useCreateUsuario() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usuariosApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
            toast.success('Usuario creado exitosamente');
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : 'Error al crear el usuario');
        },
    });
}
