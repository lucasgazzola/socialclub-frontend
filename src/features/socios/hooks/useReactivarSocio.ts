import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sociosApi } from '../api/socios.api';
import { sociosKeys } from './useSocios';

/** US-43: Hook de mutación para reactivar/re-asociar la membresía de un socio (Admin/Colaborador). */
export function useReactivarSocio() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sociosApi.activate(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sociosKeys.all });
      toast.success('Membresía reactivada con éxito. El socio se encuentra nuevamente activo.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ocurrió un error al reactivar la membresía del socio.');
    },
  });
}
