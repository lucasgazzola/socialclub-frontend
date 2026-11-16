import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  KeyRound,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  ventaAbierta,
} from '@/features/eventos/helpers';
import { useEventos } from '@/features/eventos/hooks/useEventos';
import { ROUTES } from '@/routes/paths';
import { formatearDni } from '@/lib/utils/dni';
import {
  PortalBrandLogo,
  PortalButton,
  PortalSurface,
  PortalTag,
} from '../components/PortalUI';

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

interface CeldaDatoSocio {
  etiqueta: string;
  valor: string;
  tabular?: boolean;
}

/**
 * Inicio exclusivo del Portal de Socios y Participantes.
 * Diseño Global Fan / RiverID Hub: Carnet digital hero + spotlight de agenda +
 * banda de accesos geométricos + grilla modular de identidad (cero patrones del panel admin).
 */
export function PortalInicioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  // TASK-60: «Agenda del club» muestra el próximo evento, no uno ya realizado.
  const hoy = new Date();
  const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const { data: eventosData } = useEventos({ pagina: 1, porPagina: 2, ordenar: 'fecha', fechaDesde: desde });

  if (!usuario) return null;

  const persona = usuario.persona;
  const membresiaActiva = persona?.membresias?.find((m) => m.activo);

  const nombre = usuario.nombre ?? persona?.nombre ?? '';
  const apellido = usuario.apellido ?? persona?.apellido ?? '';
  const nombreMostrado =
    apellido && nombre ? `${apellido}, ${nombre}` : nombre || usuario.email;

  const proximoEvento = eventosData?.items?.[0] ?? null;

  const celdasDatos: CeldaDatoSocio[] = [
    { etiqueta: 'Nombre', valor: nombre || '—' },
    { etiqueta: 'Apellido', valor: apellido || '—' },
    {
      etiqueta: 'Documento',
      valor: persona?.dni ? formatearDni(persona.dni) : 'Sin DNI registrado',
      tabular: true,
    },
    ...(membresiaActiva
      ? [
          {
            etiqueta: 'Categoría',
            valor: membresiaActiva.categoria?.nombre ?? 'Socio activo',
          },
          {
            etiqueta: 'Socio desde',
            valor: formatearFecha(membresiaActiva.fechaAlta),
            tabular: true,
          },
        ]
      : []),
    {
      etiqueta: 'Género',
      valor: persona?.genero ? GENERO_PERSONA_LABELS[persona.genero] : '—',
    },
    {
      etiqueta: 'Fecha de nacimiento',
      valor: persona?.fechaNacimiento ? formatearFecha(persona.fechaNacimiento) : '—',
      tabular: true,
    },
    {
      etiqueta: 'Teléfono',
      valor: persona?.telefono || 'No registrado',
      tabular: true,
    },
    {
      etiqueta: 'Mail',
      valor: usuario.email,
    },
  ];

  const tilesClub = membresiaActiva
    ? [
        { titulo: 'Reservar espacio', icon: CalendarClock, to: ROUTES.misReservas },
        { titulo: 'Mis entradas', icon: Ticket, to: ROUTES.misEntradas },
        { titulo: 'Disciplinas', icon: Dumbbell, to: ROUTES.solicitarInscripcion },
        { titulo: 'Mi documentación', icon: FileText, to: ROUTES.miDocumentacion },
      ]
    : [
        { titulo: 'Disciplinas', icon: Dumbbell, to: ROUTES.solicitarInscripcion },
        { titulo: 'Eventos', icon: CalendarDays, to: ROUTES.eventos },
        { titulo: 'Mis entradas', icon: Ticket, to: ROUTES.misEntradas },
        { titulo: 'Reservar espacio', icon: CalendarClock, to: ROUTES.misReservas },
      ];

  return (
    <div className="space-y-6">
      {/* Banda superior asimétrica: Hero Carnet Digital (7/12) + Cartelera & Seguridad (5/12) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Hero Carnet Global Fan */}
        <PortalSurface variant="pass" className="relative flex flex-col justify-between overflow-hidden p-5 sm:p-7 lg:col-span-7">
          {/* Detalles arquitectónicos azul eléctrico */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_68%)]"
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PortalBrandLogo size={28} />
                <div>
                  <h1 className="text-xs font-semibold tracking-tight text-blue-300">
                    {nombre ? `Hola, ${nombre}` : 'Tu cuenta en SocialClub'}
                  </h1>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Carnet Digital
                  </p>
                </div>
              </div>

              {membresiaActiva ? (
                <PortalTag tone="info" dot>
                  Membresía Activa
                </PortalTag>
              ) : (
                <PortalTag tone="neutral">Sumate al club</PortalTag>
              )}
            </div>

            <div className="mt-7">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[28px]">
                {nombreMostrado}
              </h2>
              <p className="mt-1 text-sm font-medium text-blue-300/90">
                {membresiaActiva
                  ? `Socio · ${membresiaActiva.categoria?.nombre ?? 'Activo'}`
                  : 'Participante'}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-blue-400/[0.16] py-3.5 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Documento
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-white tabular-nums sm:text-sm">
                  {persona?.dni ? `DNI ${formatearDni(persona.dni)}` : 'Sin registrar'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  {membresiaActiva ? 'Socio desde' : 'Estado'}
                </p>
                <p className="mt-1 text-xs font-medium text-white tabular-nums sm:text-sm">
                  {membresiaActiva ? formatearFecha(membresiaActiva.fechaAlta) : 'Sin membresía'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Identidad
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-blue-300">
                  <ShieldCheck size={13} className="shrink-0" />
                  <span className="truncate">Verificada</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-2.5">
            {membresiaActiva ? (
              <PortalButton
                variant="primary"
                className="flex-1 min-w-[165px]"
                onClick={() => navigate(ROUTES.misCuotas)}
              >
                <CreditCard size={15} />
                VER MIS CUOTAS
              </PortalButton>
            ) : (
              <PortalButton
                variant="primary"
                className="flex-1 min-w-[180px]"
                onClick={() => navigate(ROUTES.hacermeSocio)}
              >
                <UserPlus size={15} />
                QUIERO HACERME SOCIO
              </PortalButton>
            )}

            <PortalButton
              variant="secondary"
              className="flex-1 min-w-[155px]"
              onClick={() => navigate(ROUTES.eventos)}
            >
              <CalendarDays size={15} />
              Explorar eventos
            </PortalButton>
          </div>
        </PortalSurface>

        {/* Spotlight derecho estilo RiverID: Próximo Evento + Gestión de Cuenta */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-5">
          <PortalSurface className="relative flex flex-1 flex-col justify-between overflow-hidden p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-500/60 via-blue-400/20 to-transparent"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
                  Agenda del club
                </span>
                {proximoEvento && (
                  <PortalTag tone={ventaAbierta(proximoEvento) ? 'info' : 'neutral'}>
                    {getEstadoVisual(proximoEvento).label}
                  </PortalTag>
                )}
              </div>

              {proximoEvento ? (
                <div className="mt-3.5">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                    {proximoEvento.nombre}
                  </h3>
                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-400">
                    <p className="flex items-center gap-2 tabular-nums">
                      <CalendarDays size={13} className="shrink-0 text-blue-400" />
                      <span>{formatFechaEvento(proximoEvento.fechaEvento)}</span>
                    </p>
                    {proximoEvento.lugarAcreditacion && (
                      <p className="flex items-center gap-2">
                        <MapPin size={13} className="shrink-0 text-blue-400" />
                        <span className="truncate">{proximoEvento.lugarAcreditacion}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2 border-t border-white/[0.07] pt-3">
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {formatPrecio(proximoEvento.precio)}
                    </span>
                    {formatPrecioSocio(proximoEvento.precio, proximoEvento.descuentoSocio) && (
                      <span className="text-xs font-medium text-blue-400 tabular-nums">
                        {formatPrecioSocio(proximoEvento.precio, proximoEvento.descuentoSocio)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3.5">
                  <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                    Torneos, peñas y actividades
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    Consultá las próximas fechas del club y adquirí tus pases digitales con
                    beneficios exclusivos.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <PortalButton
                variant="secondary"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate(ROUTES.eventos)}
              >
                <span>Ver calendario completo</span>
                <ArrowRight size={14} className="text-blue-400" />
              </PortalButton>
            </div>
          </PortalSurface>

          {/* Barra de configuración y seguridad */}
          <PortalSurface variant="muted" className="p-4">
            <p className="truncate text-xs text-slate-400">
              Sesión activa · <span className="font-medium text-slate-200">{usuario.email}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PortalButton
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => navigate(ROUTES.perfil)}
              >
                <User size={13} />
                Editar mis datos
              </PortalButton>
              <PortalButton
                variant="ghost"
                size="sm"
                className="w-full border border-white/[0.09]"
                onClick={() => navigate(ROUTES.cambiarContrasena)}
              >
                <KeyRound size={13} />
                Contraseña
              </PortalButton>
            </div>
          </PortalSurface>
        </div>
      </div>

      {/* Tira horizontal estilo RiverID "Actividades": 4 bloques geométricos afilados */}
      <section aria-labelledby="portal-accesos-titulo" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="portal-accesos-titulo"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            Accesos del club
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tilesClub.map(({ titulo, icon: Icon, to }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[2px] border border-white/[0.09] bg-[#070c16] px-4 py-6 text-center transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-blue-500/45 hover:bg-[#0b1324] hover:shadow-[0_12px_30px_-18px_rgba(37,99,235,0.65)] active:scale-[0.98] cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-blue-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-blue-400/20 bg-blue-500/[0.08] text-blue-400 transition-colors group-hover:border-blue-400/45 group-hover:bg-blue-500/15 group-hover:text-blue-300">
                <Icon size={21} strokeWidth={1.6} />
              </span>
              <span className="text-xs font-semibold tracking-[0.04em] text-slate-100">
                {titulo}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Grilla editorial de datos personales (sin filas de tabla admin) */}
      <section aria-labelledby="portal-datos-titulo" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="portal-datos-titulo"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
          >
            Datos del titular
          </h2>
          <button
            type="button"
            onClick={() => navigate(ROUTES.perfil)}
            className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 cursor-pointer"
          >
            Actualizar información →
          </button>
        </div>

        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[2px] border border-white/[0.09] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3">
          {celdasDatos.map(({ etiqueta, valor, tabular }) => (
            <div key={etiqueta} className="bg-[#060b14] px-4 py-3.5">
              <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-500">
                {etiqueta}
              </dt>
              <dd
                className={`mt-1 truncate text-sm font-medium text-slate-100 ${tabular ? 'tabular-nums' : ''}`}
              >
                {valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
