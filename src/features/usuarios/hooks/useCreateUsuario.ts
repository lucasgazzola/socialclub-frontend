import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api';
import { toast } from 'sonner';

export function useCreateUsuario() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: usuariosApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });

            toast.success('Usuario creado exitosamente');
        },

        onError: (error: any) => {
            toast.error( error?.response?.data?.message ?? 'Error al crear el usuario');
        },
    });
}
