/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  socios: '/socios',
<<<<<<< HEAD
  sociosNuevo: '/socios/nuevo',
  sociosEditar: '/socios/:id/editar',
  cuotas: '/cuotas',
  usuarios: '/usuarios',
  auditoria: '/auditoria',
  inscripcion: '/inscripcion',
} as const;
