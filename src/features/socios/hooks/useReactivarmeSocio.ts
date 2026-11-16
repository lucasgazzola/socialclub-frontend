import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { sociosApi } from '../api/socios.api';
import { sociosKeys } from './useSocios';

/** US-43: Hook de mutación para que un ex-socio reactive su propia membresía. */
export function useReactivarmeSocio() {
  const qc = useQueryClient();
  const { refrescar } = useAuth();

  return useMutation({
    mutationFn: () => sociosApi.reactivarme(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sociosKeys.all });
      await refrescar();
      toast.success('Reactivación realizada con éxito. Tu membresía y beneficios fueron restablecidos.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ocurrió un error al procesar la reactivación de tu membresía.');
    },
  });
}
