/**
 * Rutas centralizadas. Referenciar `ROUTES.xxx` en vez de strings sueltos evita
 * typos y facilita renombrar rutas en un único lugar.
 *
 * TASK-60: el sitio tiene tres zonas.
 * - Pública: la landing del club (`/`), el alta de socio y las pantallas de acceso.
 * - Mi club (`/mi-club`): autogestión de socios y participantes. Todo lo
 *   personal vive acá, también para los usuarios con roles de gestión.
 * - Panel (`/admin`): la gestión del club (ADMIN, COLABORADOR y DELEGADO).
 */
const ADMIN = '/admin';
const MI_CLUB = '/mi-club';

export const ROUTES = {
  // ── Públicas ────────────────────────────────────────────────────────────
  inicio: '/',
  login: '/login',
  register: '/register',
  /** DT-54: pantalla pública del enlace del email (la API arma el link con esta ruta). */
  verificarEmail: '/verificar-email',
  /** TASK-60 · US-09: alta de socio desde la landing (plan → datos → primera cuota). */
  hacermeSocio: '/asociarme',

  // ── Mi club (autogestión) ───────────────────────────────────────────────
  miClub: MI_CLUB,
  misEntradas: `${MI_CLUB}/entradas`,
  /** Catálogo de eventos para comprar entradas. */
  eventos: `${MI_CLUB}/eventos`,
  comprarEntradas: (eventoId: number) => `${MI_CLUB}/eventos/${eventoId}/entradas`,
  misCuotas: `${MI_CLUB}/cuotas`,
  misDisciplinas: `${MI_CLUB}/disciplinas`,
  /** US-63: postulación / solicitud de inscripción a disciplina. */
  solicitarInscripcion: `${MI_CLUB}/disciplinas/solicitar`,
  /** US-64: consulta de mis solicitudes de inscripción. */
  misSolicitudesInscripcion: `${MI_CLUB}/disciplinas/solicitudes`,
  /** DT-28: consulta de propia documentación para socio/participante. */
  miDocumentacion: `${MI_CLUB}/disciplinas/documentacion`,
  /** US-59, US-62. */
  misReservas: `${MI_CLUB}/reservas`,
  solicitarReserva: `${MI_CLUB}/reservas/solicitar`,
  perfil: `${MI_CLUB}/perfil`,
  cambiarContrasena: `${MI_CLUB}/perfil/cambiar-contrasena`,
  /** TASK-51: vuelta de la pasarela de pagos y simulador. La API arma estos links: no mover. */
  resultadoPago: '/pagos/resultado',
  simuladorPago: '/pagos/simulador',

  // ── Panel de gestión ────────────────────────────────────────────────────
  dashboard: ADMIN,
  dashboardGestion: `${ADMIN}/dashboard`,
  socios: `${ADMIN}/socios`,
  /** DT-20: las ediciones son modales sobre el listado (?editar=<id>). */
  editarSocio: (id: number) => `${ADMIN}/socios?editar=${id}`,
  cuotas: `${ADMIN}/cuotas`,
  disciplinas: `${ADMIN}/disciplinas`,
  categoriasDisciplina: (disciplinaId: number) => `${ADMIN}/disciplinas/${disciplinaId}/categorias`,
  cuotaDeportiva: `${ADMIN}/cuotas/deportiva`,
  cuotaSocial: `${ADMIN}/cuotas/social`,
  editarCuotaSocial: (id: number) => `${ADMIN}/cuotas/social?editar=${id}`,
  usuarios: `${ADMIN}/usuarios`,
  /** Alta y edición de eventos. */
  eventosAdmin: `${ADMIN}/eventos`,
  auditoria: `${ADMIN}/auditoria`,
  /** DT-22: tareas automáticas (solo ADMIN). */
  tareas: `${ADMIN}/tareas`,
  inscripcion: `${ADMIN}/inscripcion`,
  validarAcceso: `${ADMIN}/entradas/validar`,
  validarAccesoEvento: (eventoId: number) => `${ADMIN}/eventos/${eventoId}/validar`,
  participantes: `${ADMIN}/participantes`,
  /** DT-11: abre el alta de inscripción dentro de Participantes. */
  nuevaInscripcion: `${ADMIN}/participantes?nueva=1`,
  editarParticipante: (id: number) => `${ADMIN}/participantes?editar=${id}`,
  documentacion: `${ADMIN}/documentacion`,
  /** US-60 y US-55. */
  solicitudesReserva: `${ADMIN}/reservas/solicitudes`,
  espacios: `${ADMIN}/espacios`,
  cobrarCuotaDeportiva: `${ADMIN}/cuotas/deportiva/cobrar`,
  /** US-23: abre el cobro con el participante ya buscado. */
  cobrarCuotaDeportivaDe: (dni: string) =>
    `${ADMIN}/cuotas/deportiva/cobrar?dni=${encodeURIComponent(dni)}`,
  morososCuotaDeportiva: `${ADMIN}/cuotas/deportiva/morosos`,
  /** US-35. */
  estadoFinanciero: `${ADMIN}/reportes/estado-financiero`,
  /** US-36. */
  reporteAsistencia: `${ADMIN}/reportes/asistencia-eventos`,
  historialCuotaDeportiva: `${ADMIN}/cuotas/deportiva/historial`,
  morososCuotaSocial: `${ADMIN}/cuotas/social/morosos`,
} as const;

/** Roles que usan el panel de gestión. */
export const ROLES_GESTION = ['ADMIN', 'COLABORADOR', 'DELEGADO'] as const;

export function esDeGestion(roles: readonly string[] | undefined): boolean {
  return Boolean(roles?.some((rol) => (ROLES_GESTION as readonly string[]).includes(rol)));
}

/** A dónde va cada usuario al ingresar: la gestión al panel y el resto a Mi club. */
export function destinoAlIngresar(roles: readonly string[] | undefined): string {
  return esDeGestion(roles) ? ROUTES.dashboard : ROUTES.miClub;
}

/**
 * Puente entre el panel y Mi club. Solo quien gestiona y además es socio
 * pertenece a las dos zonas. 0008.
 */
export function cruzaZonas(roles: readonly string[] | undefined): boolean {
  return esDeGestion(roles) && Boolean(roles?.includes('SOCIO'));
}

/** Zonas a las que la landing puede mandar a alguien que ya tiene sesión. */
export function destinosDeSesion(
  roles: readonly string[] | undefined,
): { to: string; etiqueta: string }[] {
  const destinos: { to: string; etiqueta: string }[] = [];
  if (esDeGestion(roles)) destinos.push({ to: ROUTES.dashboard, etiqueta: 'Ir al panel' });
  if (!esDeGestion(roles) || cruzaZonas(roles)) {
    destinos.push({ to: ROUTES.miClub, etiqueta: 'Ir a Mi club' });
  }
  return destinos;
}

/**
 * Rutas del panel anteriores a TASK-60 (sin el prefijo `/admin`). Se redirigen
 * para no romper marcadores ni enlaces viejos.
 */
const PREFIJOS_PANEL_VIEJOS = [
  '/dashboard',
  '/socios',
  '/cuotas',
  '/disciplinas',
  '/usuarios',
  '/auditoria',
  '/tareas',
  '/inscripcion',
  '/participantes',
  '/participante',
  '/documentacion',
  '/entradas/validar',
  '/reservas/solicitudes',
  '/espacios',
  '/reportes',
];

/** Rutas personales anteriores a TASK-60 y su lugar en Mi club. */
const RUTAS_PERSONALES_VIEJAS: Record<string, string> = {
  '/mis-entradas': ROUTES.misEntradas,
  '/mis-cuotas': ROUTES.misCuotas,
  '/mis-reservas': ROUTES.misReservas,
  '/reservas/solicitar': ROUTES.solicitarReserva,
  '/mi-documentacion': ROUTES.miDocumentacion,
  '/inscripcion/solicitar': ROUTES.solicitarInscripcion,
  '/inscripcion/mis-solicitudes': ROUTES.misSolicitudesInscripcion,
  '/perfil': ROUTES.perfil,
  '/mi-perfil': ROUTES.perfil,
  '/perfil/cambiar-contrasena': ROUTES.cambiarContrasena,
  '/hacerme-socio': ROUTES.hacermeSocio,
  '/eventos': ROUTES.eventos,
};

/** Devuelve la ruta nueva de una ruta anterior a TASK-60, o null si no la conoce. */
export function rutaNuevaDe(pathname: string): string | null {
  if (RUTAS_PERSONALES_VIEJAS[pathname]) return RUTAS_PERSONALES_VIEJAS[pathname];
  const compra = /^\/eventos\/(\d+)\/entradas$/.exec(pathname);
  if (compra) return ROUTES.comprarEntradas(Number(compra[1]));
  const validar = /^\/eventos\/(\d+)\/validar$/.exec(pathname);
  if (validar) return ROUTES.validarAccesoEvento(Number(validar[1]));
  if (PREFIJOS_PANEL_VIEJOS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return `${ADMIN}${pathname}`;
  }
  return null;
}
