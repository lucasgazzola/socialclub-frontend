import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { inscripcionesKeys } from './useInscripciones';

export async function eliminarInscripcion(id: number): Promise<void> {
  await apiClient.delete(`/inscripcion/${id}`);
}

export function useEliminarInscripcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarInscripcion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inscripcionesKeys.all });
      toast.success('Disciplina eliminada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la disciplina');
    },
  });
}