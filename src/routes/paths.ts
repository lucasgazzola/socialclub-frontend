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
  /** DT-20: las ediciones son modales sobre el listado (?editar=<id>). */
  editarSocio: (id: number) => `/socios?editar=${id}`,
  cuotas: '/cuotas',
  disciplinas: '/disciplinas',
  categoriasDisciplina: (disciplinaId: number) => `/disciplinas/${disciplinaId}/categorias`,
  cuotaDeportiva: '/cuotas/deportiva',
  cuotaSocial: '/cuotas/social',
  editarCuotaSocial: (id: number) => `/cuotas/social?editar=${id}`,
  usuarios: '/usuarios',
  eventos: '/eventos',
  comprarEntradas: (eventoId: number) => `/eventos/${eventoId}/entradas`,
  eventosAdmin: '/eventos/admin',
  auditoria: '/auditoria',
  /** DT-22: tareas automáticas (solo ADMIN). */
  tareas: '/tareas',
  inscripcion: '/inscripcion',
  validarAcceso: '/entradas/validar',
  validarAccesoEvento: (eventoId: number) => `/eventos/${eventoId}/validar`,
  participantes: '/participantes',
  /** DT-11: abre el alta de inscripción dentro de Participantes. */
  nuevaInscripcion: '/participantes?nueva=1',
  editarParticipante: (id: number) => `/participantes?editar=${id}`,
  documentacion: '/documentacion',
  perfil: '/perfil',
  cambiarContrasena: '/perfil/cambiar-contrasena',
  misCuotas: '/mis-cuotas',
  misEntradas: '/mis-entradas',
  cobrarCuotaDeportiva: '/cuotas/deportiva/cobrar',
  historialCuotaDeportiva: '/cuotas/deportiva/historial',
} as const;


