import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { entradasApi } from '../api/entradas.api';

/**
 * Organiza las keys de las queries para que sean consistentes y faciles de usar en los hooks.
 * Permite que la pantalla se mantenga sincronizada con el backend cuando cambian los datos.
 */
export const entradasKeys = {
  all: ['entradas'] as const,
  eventos: ['eventos'] as const,
  evento: (id: number) => ['eventos', id] as const,
  porEvento: (eventoId: number) => [...entradasKeys.all, 'por-evento', eventoId] as const,
};

// Hook para consultar la lista de todos los eventos.
export function useEventos() {
  return useQuery({
    queryKey: entradasKeys.eventos,
    queryFn: () => entradasApi.listarEventos(),
  });
}

// Hook para consultar los detalles de un evento especifico por su ID.
export function useEvento(id: number) {
  return useQuery({
    queryKey: entradasKeys.evento(id),
    queryFn: () => entradasApi.getEvento(id),
    enabled: !!id,
  });
}

/**
 * Custom Hook (mutacion) para crear entradas. Se hace de esta forma para que al terminar
 * invalide las queries relevantes y de esta forma la UI se mantenga sincronizada con el backend.
 */
export function useCrearEntradas() {
  const qc = useQueryClient(); // Invalida queries despues de una mutacion, para que se refresquen los datos.
  return useMutation({
    // mutationFn es la funcion que llama a CrearEntradas para el evento especifico con su respectiva cantidad de entradas.
    mutationFn: ({ eventoId, cantidad }: { eventoId: number; cantidad: number }) =>
      entradasApi.crearEntradas(eventoId, cantidad),
    /** 
     * onSuccess es la funcion que se ejecuta despues de que la mutacion se completa exitosamente.
     * Asegura que la pantalla se actualice automaticamente con los datos nuevos, sin tener que hacer un fetch manual.
     */
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: entradasKeys.eventos });
      qc.invalidateQueries({ queryKey: entradasKeys.evento(data.eventoId) });
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