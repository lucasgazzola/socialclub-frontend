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
  /** TASK-51: vuelta de la pasarela de pagos y simulador (sin credenciales de Mercado Pago). */
  resultadoPago: '/pagos/resultado',
  /** US-62 y US-60. */
  misReservas: '/mis-reservas',
  solicitudesReserva: '/reservas/solicitudes',
  simuladorPago: '/pagos/simulador',
  /** US-63: postulación / solicitud de inscripción a disciplina. */
  solicitarInscripcion: '/inscripcion/solicitar',
  /** DT-28: consulta de propia documentación para socio/participante. */
  miDocumentacion: '/mi-documentacion',
  cobrarCuotaDeportiva: '/cuotas/deportiva/cobrar',
  /** US-23: abre el cobro con el participante ya buscado. */
  cobrarCuotaDeportivaDe: (dni: string) => `/cuotas/deportiva/cobrar?dni=${encodeURIComponent(dni)}`,
  morososCuotaDeportiva: '/cuotas/deportiva/morosos',
  /** US-35. */
  estadoFinanciero: '/reportes/estado-financiero',
  /** US-36. */
  reporteAsistencia: '/reportes/asistencia-eventos',
  historialCuotaDeportiva: '/cuotas/deportiva/historial',
  morososCuotaSocial: '/cuotas/social/morosos',
} as const;
