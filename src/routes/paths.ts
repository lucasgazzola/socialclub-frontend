/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  socios: '/socios',
  sociosNuevo: '/socios/nuevo',
  usuarios: '/usuarios',
} as const;
