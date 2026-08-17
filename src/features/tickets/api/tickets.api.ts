import { apiClient } from '@/lib/api/client';
import type { CreateTicketsResult, Ticket, Event } from '../types';

export const ticketsApi = {
  async listEvents(): Promise<Event[]> {
    const { data } = await apiClient.get<Event[]>('/events');
    return data;
  },

  async getEvent(id: number): Promise<Event> {
    const { data } = await apiClient.get<Event>(`/events/${id}`);
    return data;
  },

  async createTickets(eventId: number, quantity: number): Promise<CreateTicketsResult> {
    const { data } = await apiClient.post<CreateTicketsResult>('/tickets', {
      eventId,
      quantity,
    });
    return data;
  },

  async listTicketsByEvent(eventId: number): Promise<Ticket[]> {
    const { data } = await apiClient.get<Ticket[]>(`/tickets/event/${eventId}`);
    return data;
  },
};
