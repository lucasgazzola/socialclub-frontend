/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 */
export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  hacermeSocio: '/hacerme-socio',
  socios: '/socios',
  sociosEditar: '/socios/:id/editar',
  cuotas: '/cuotas',
  cuotaDeportiva: '/cuotas/deportiva',
  cuotaSocial: '/cuotas/social',
  cuotaSocialEditar: (id: number) => `/cuotas/social/${id}/editar`,
  usuarios: '/usuarios',
  eventos: '/eventos',
  comprarEntradas: (eventoId: number) => `/eventos/${eventoId}/entradas`,
  eventosAdmin: '/eventos/admin',
  auditoria: '/auditoria',
  inscripcion: '/inscripcion',
  participantes: '/participantes',
  participantesEditar: '/participante/:id/editar',
  documentacion: '/documentacion',
  perfil: '/perfil',
} as const;
