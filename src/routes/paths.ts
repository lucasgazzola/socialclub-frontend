/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  socios: '/socios',
  sociosNuevo: '/socios/nuevo',
  sociosEditar: '/socios/:id/editar',
  cuotas: '/cuotas',
  usuarios: '/usuarios',
  eventos: '/eventos',
  comprarEntradas: (eventoId: number) => `/eventos/${eventoId}/entradas`,
  crearEvento: '/eventos/nuevo',
  eventosAdmin: '/eventos/admin',
} as const;
