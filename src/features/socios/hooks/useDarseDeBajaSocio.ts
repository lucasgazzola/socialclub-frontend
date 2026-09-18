import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { sociosApi } from '../api/socios.api';
import { sociosKeys } from './useSocios';

/** US-42: Hook de mutación para dar de baja la membresía del socio logueado. */
export function useDarseDeBajaSocio() {
  const qc = useQueryClient();
  const { refrescar } = useAuth();

  return useMutation({
    mutationFn: () => sociosApi.darseDeBaja(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sociosKeys.all });
      await refrescar();
      toast.success('Baja realizada con éxito. Tu membresía ha sido desactivada.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ocurrió un error al procesar la baja como socio.');
    },
  });
}
