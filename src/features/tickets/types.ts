export type TicketStatus = 'VALID' | 'USED' | 'EXPIRED';

export interface Event {
  id: number;
  name: string;
  description?: string | null;
  availableTickets: number;
  soldTickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  token: string;
  eventId: number;
  status: TicketStatus;
  createdAt: string;
  evento?: Event;
}

export interface CreateTicketsResult {
  eventId: number;
  eventName: string;
  quantity: number;
  entradas: Ticket[];
}