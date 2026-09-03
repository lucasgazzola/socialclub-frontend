import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { entradasApi } from '../api/entradas.api';

/**
 * Organiza las keys de las queries para que sean consistentes y faciles de usar en los hooks.
 * Permite que la pantalla se mantenga sincronizada con el backend cuando cambian los datos.
 */
export const entradasKeys = {
  all: ['entradas'] as const,
  porEvento: (eventoId: number) => [...entradasKeys.all, 'por-evento', eventoId] as const,
};

/**
 * Custom Hook (mutacion) para crear entradas. Se hace de esta forma para que al terminar
 * invalide las queries relevantes y de esta forma la UI se mantenga sincronizada con el backend.
 */
export function useCrearEntradas() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ eventoId, cantidad }: { eventoId: number; cantidad: number }) =>
      entradasApi.crearEntradas(eventoId, cantidad),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['eventos'] });
      qc.invalidateQueries({ queryKey: ['eventos', data.eventoId] });
      qc.invalidateQueries({ queryKey: entradasKeys.porEvento(data.eventoId) });
    },
  });
}

export function useEntradasPorEvento(eventoId: number) {
  return useQuery({
    queryKey: entradasKeys.porEvento(eventoId),
    queryFn: () => entradasApi.listarEntradasPorEvento(eventoId),
    enabled: !!eventoId,
  });
}