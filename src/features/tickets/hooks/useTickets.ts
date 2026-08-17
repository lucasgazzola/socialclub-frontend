import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets.api';

/**
 * Organiza las keys de las queries para que sean consistentes y faciles de usar en los hooks.
 * Permite que la pantalla se mantenga sincronizada con el backend cuando cambian los datos.
 */
export const entradasKeys = {
  all: ['entradas'] as const,
  eventos: ['eventos'] as const,
  event: (id: number) => ['eventos', id] as const,
  porEvento: (eventId: number) => [...entradasKeys.all, 'por-evento', eventId] as const,
};

// Hook para consultar la lista de todos los eventos.
export function useEvents() {
  return useQuery({
    queryKey: entradasKeys.eventos,
    queryFn: () => ticketsApi.listEvents(),
  });
}

// Hook para consultar los detalles de un evento especifico por su ID.
export function useEvent(id: number) {
  return useQuery({
    queryKey: entradasKeys.event(id),
    queryFn: () => ticketsApi.getEvent(id),
    enabled: !!id,
  });
}

/**
 * Custom Hook (mutacion) para crear entradas. Se hace de esta forma para que al terminar
 * invalide las queries relevantes y de esta forma la UI se mantenga sincronizada con el backend.
 */
export function useCreateTickets() {
  const qc = useQueryClient(); // Invalida queries despues de una mutacion, para que se refresquen los datos.
  return useMutation({
    // mutationFn es la funcion que llama a CrearEntradas para el evento especifico con su respectiva quantity de entradas.
    mutationFn: ({ eventId, quantity }: { eventId: number; quantity: number }) =>
      ticketsApi.createTickets(eventId, quantity),
    /** 
     * onSuccess es la funcion que se ejecuta despues de que la mutacion se completa exitosamente.
     * Asegura que la pantalla se actualice automaticamente con los datos nuevos, sin tener que hacer un fetch manual.
     */
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: entradasKeys.eventos });
      qc.invalidateQueries({ queryKey: entradasKeys.event(data.eventId) });
      qc.invalidateQueries({ queryKey: entradasKeys.porEvento(data.eventId) });
    },
  });
}

export function useTicketsByEvent(eventId: number) {
  return useQuery({
    queryKey: entradasKeys.porEvento(eventId),
    queryFn: () => ticketsApi.listTicketsByEvent(eventId),
    enabled: !!eventId,
  });
}