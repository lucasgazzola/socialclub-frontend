/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  socios: '/socios',
<<<<<<< HEAD
  sociosNuevo: '/socios/nuevo',
=======
  sociosEditar: '/socios/:id/editar',
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
  usuarios: '/usuarios',
  inscripcion: '/inscripcion',
} as const;
