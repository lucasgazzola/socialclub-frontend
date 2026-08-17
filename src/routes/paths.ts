/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  members: '/members',
  membersNew: '/members/new',
  membersEdit: '/members/:id/edit',
  fees: '/fees',
  users: '/users',
  events: '/events',
  buyTickets: (eventId: number) => `/events/${eventId}/tickets`,
} as const;
