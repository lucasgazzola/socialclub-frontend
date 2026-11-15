import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileText,
  KeyRound,
  Pencil,
  ShieldCheck,
  Ticket,
  User,
  UserPlus,
} from 'lucide-react';
import { ClubLogo } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import { ROUTES } from '@/routes/paths';
import { formatearDni } from '@/lib/utils/dni';
import { PortalButton, PortalPanel, PortalStatusPill } from '../components/PortalUI';

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

interface FilaDatoSocio {
  etiqueta: string;
  valor: string;
  editable?: boolean;
  tabular?: boolean;
}

/**
 * Inicio exclusivo del Portal de Socios y Participantes.
 * Diseñado desde cero con arquitectura bento tipo Global Fan (Billetera Digital +
 * accesos del club + ficha de identidad), completamente separado de DashboardPage admin.
 */
export function PortalInicioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const persona = usuario.persona;
  const membresiaActiva = persona?.membresias?.find((m) => m.activo);

  const nombre = usuario.nombre ?? persona?.nombre ?? '';
  const apellido = usuario.apellido ?? persona?.apellido ?? '';
  const nombreMostrado =
    apellido && nombre ? `${apellido}, ${nombre}` : nombre || usuario.email;

  const filasDatos: FilaDatoSocio[] = [
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
      editable: true,
      tabular: true,
    },
    {
      etiqueta: 'Mail',
      valor: usuario.email,
      editable: true,
    },
  ];

  const accesosClub = membresiaActiva
    ? [
        {
          titulo: 'Reservar espacio',
          descripcion: 'Consultá tus turnos solicitados, pagá señas online o gestioná reservas.',
          icon: CalendarClock,
          to: ROUTES.misReservas,
          iconoClass: 'text-emerald-400',
        },
        {
          titulo: 'Mis entradas',
          descripcion: 'Accedé a tus códigos QR digitales para ingresar a eventos del club.',
          icon: Ticket,
          to: ROUTES.misEntradas,
          iconoClass: 'text-sky-400',
        },
        {
          titulo: 'Disciplinas',
          descripcion: 'Postulate a categorías deportivas activas y seguí tus solicitudes.',
          icon: Dumbbell,
          to: ROUTES.solicitarInscripcion,
          iconoClass: 'text-zinc-200',
        },
        {
          titulo: 'Mi documentación',
          descripcion: 'Verificá vigencias y requisitos documentales de tus inscripciones.',
          icon: FileText,
          to: ROUTES.miDocumentacion,
          iconoClass: 'text-zinc-200',
        },
      ]
    : [
        {
          titulo: 'Inscribirme a disciplina',
          descripcion: 'Explorá el catálogo de disciplinas y enviá tu solicitud de ingreso.',
          icon: Dumbbell,
          to: ROUTES.solicitarInscripcion,
          iconoClass: 'text-emerald-400',
        },
        {
          titulo: 'Explorar eventos',
          descripcion: 'Descubrí los próximos encuentros y adquirí tus entradas digitales.',
          icon: CalendarDays,
          to: ROUTES.eventos,
          iconoClass: 'text-sky-400',
        },
        {
          titulo: 'Mis entradas',
          descripcion: 'Visualizá y descargá tus pases QR listos para presentar en puerta.',
          icon: Ticket,
          to: ROUTES.misEntradas,
          iconoClass: 'text-zinc-200',
        },
        {
          titulo: 'Mis reservas',
          descripcion: 'Consultá el estado de tus solicitudes de alquiler de espacios.',
          icon: CalendarClock,
          to: ROUTES.misReservas,
          iconoClass: 'text-zinc-200',
        },
      ];

  return (
    <div className="space-y-8">
      {/* Encabezado editorial limpio (sin kicker/eyebrow) */}
      <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            {nombre ? `Hola, ${nombre}` : 'Tu cuenta en SocialClub'}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Tu pase digital, gestiones del club y datos de cuenta en un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PortalButton variant="secondary" size="sm" onClick={() => navigate(ROUTES.perfil)}>
            <User size={14} />
            Editar mis datos
          </PortalButton>
          <PortalButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.cambiarContrasena)}
          >
            <KeyRound size={14} />
            Cambiar contraseña
          </PortalButton>
        </div>
      </header>

      {/* Bento Grid Asimétrico 12 columnas */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Columna Izquierda (5/12): Billetera Digital / Carnet de Identidad */}
        <div className="space-y-4 lg:col-span-5">
          <PortalPanel variant="pass" className="relative overflow-hidden p-6 sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.12),transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
            />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ClubLogo size={30} />
                <span className="text-sm font-semibold tracking-[-0.02em] text-zinc-200">
                  SocialClub
                </span>
              </div>

              {membresiaActiva ? (
                <PortalStatusPill tone="active" dot>
                  Membresía Activa
                </PortalStatusPill>
              ) : (
                <PortalStatusPill tone="neutral">Sumate al club</PortalStatusPill>
              )}
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                {nombreMostrado}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {membresiaActiva
                  ? `Socio · ${membresiaActiva.categoria?.nombre ?? 'Activo'}`
                  : 'Participante'}
              </p>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Documento
                </p>
                <p className="mt-1 font-mono text-sm font-medium tabular-nums text-zinc-100">
                  {persona?.dni ? `DNI ${formatearDni(persona.dni)}` : 'Sin registrar'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {membresiaActiva ? 'Socio desde' : 'Estado'}
                </p>
                <p className="mt-1 text-sm font-medium tabular-nums text-zinc-100">
                  {membresiaActiva ? formatearFecha(membresiaActiva.fechaAlta) : 'Sin membresía'}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-7 flex flex-col gap-2.5">
              {membresiaActiva ? (
                <PortalButton
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(ROUTES.misCuotas)}
                >
                  <CreditCard size={15} />
                  VER MIS CUOTAS
                </PortalButton>
              ) : (
                <PortalButton
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(ROUTES.hacermeSocio)}
                >
                  <UserPlus size={15} />
                  QUIERO HACERME SOCIO
                </PortalButton>
              )}

              <PortalButton
                variant="secondary"
                className="w-full"
                onClick={() => navigate(ROUTES.eventos)}
              >
                <CalendarDays size={15} />
                Explorar eventos
              </PortalButton>
            </div>
          </PortalPanel>

          {/* Módulo compacto de verificación / seguridad */}
          <PortalPanel className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-emerald-400">
                <ShieldCheck size={17} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">Cuenta verificada</p>
                <p className="truncate text-xs text-zinc-400">{usuario.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.perfil)}
              aria-label="Ir a editar mis datos"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/[0.1] hover:text-white active:scale-[0.95] cursor-pointer"
            >
              <Pencil size={13} />
            </button>
          </PortalPanel>
        </div>

        {/* Columna Derecha (7/12): Accesos operativos + Ficha personal */}
        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accesosClub.map(({ titulo, descripcion, icon: Icon, to, iconoClass }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d1016] p-5 text-left transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-white/[0.18] hover:bg-[#121620] active:scale-[0.985] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                    <Icon size={17} className={iconoClass} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-zinc-500 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-200"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{descripcion}</p>
                </div>
              </button>
            ))}
          </div>

          <PortalPanel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                  Datos personales
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Información vinculada a tu carnet digital, inscripciones y reservas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.perfil)}
                className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300 cursor-pointer"
              >
                Actualizar ficha
              </button>
            </div>

            <dl className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {filasDatos.map(({ etiqueta, valor, editable, tabular }) => (
                <div
                  key={etiqueta}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <dt className="text-zinc-400">{etiqueta}</dt>
                  <div className="flex items-center gap-3">
                    <dd
                      className={`font-medium text-zinc-100 ${tabular ? 'tabular-nums' : ''}`}
                    >
                      {valor}
                    </dd>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.perfil)}
                        className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300 cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </dl>
          </PortalPanel>
        </div>
      </div>
    </div>
  );
}
