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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import { ROUTES } from '@/routes/paths';
import { formatearDni } from '@/lib/utils/dni';
import {
  PortalBrandLogo,
  PortalButton,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

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
 * Credencial digital azul/obsidian a la izquierda + accesos y ficha personal sin card-in-card.
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
          descripcion: 'Consultá turnos solicitados, pagá señas o gestioná reservas.',
          icon: CalendarClock,
          to: ROUTES.misReservas,
        },
        {
          titulo: 'Mis entradas',
          descripcion: 'Accedé a tus pases QR digitales listos para puerta.',
          icon: Ticket,
          to: ROUTES.misEntradas,
        },
        {
          titulo: 'Disciplinas',
          descripcion: 'Postulate a actividades deportivas activas y seguí tus solicitudes.',
          icon: Dumbbell,
          to: ROUTES.solicitarInscripcion,
        },
        {
          titulo: 'Mi documentación',
          descripcion: 'Verificá vigencias, vencimientos y certificados cargados.',
          icon: FileText,
          to: ROUTES.miDocumentacion,
        },
      ]
    : [
        {
          titulo: 'Inscribirme a disciplina',
          descripcion: 'Explorá disciplinas vigentes y enviá tu solicitud de ingreso.',
          icon: Dumbbell,
          to: ROUTES.solicitarInscripcion,
        },
        {
          titulo: 'Explorar eventos',
          descripcion: 'Descubrí los próximos encuentros y comprá entradas digitales.',
          icon: CalendarDays,
          to: ROUTES.eventos,
        },
        {
          titulo: 'Mis entradas',
          descripcion: 'Visualizá y descargá tus códigos QR listos para presentar.',
          icon: Ticket,
          to: ROUTES.misEntradas,
        },
        {
          titulo: 'Mis reservas',
          descripcion: 'Consultá tus solicitudes de espacios y pagos de seña.',
          icon: CalendarClock,
          to: ROUTES.misReservas,
        },
      ];

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title={nombre ? `Hola, ${nombre}` : 'Tu cuenta en SocialClub'}
        actions={
          <>
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
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Columna izquierda (5/12): Credencial digital obsidian + detalle azul */}
        <div className="space-y-3 lg:col-span-5">
          <PortalSurface variant="pass" className="relative overflow-hidden p-5 sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_70%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
            />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PortalBrandLogo size={28} />
                <span className="text-xs font-semibold tracking-tight text-blue-200">
                  CREDENCIAL DIGITAL
                </span>
              </div>

              {membresiaActiva ? (
                <PortalTag tone="info" dot>
                  Membresía Activa
                </PortalTag>
              ) : (
                <PortalTag tone="neutral">Sumate al club</PortalTag>
              )}
            </div>

            <div className="relative z-10 mt-7">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">
                {nombreMostrado}
              </h2>
              <p className="mt-1 text-sm font-medium text-blue-300/90">
                {membresiaActiva
                  ? `Socio · ${membresiaActiva.categoria?.nombre ?? 'Activo'}`
                  : 'Participante'}
              </p>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-blue-400/[0.15] pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Documento
                </p>
                <p className="mt-1 font-mono text-sm font-medium text-white tabular-nums">
                  {persona?.dni ? `DNI ${formatearDni(persona.dni)}` : 'Sin registrar'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {membresiaActiva ? 'Socio desde' : 'Estado'}
                </p>
                <p className="mt-1 text-sm font-medium text-white tabular-nums">
                  {membresiaActiva ? formatearFecha(membresiaActiva.fechaAlta) : 'Sin membresía'}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-col gap-2">
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
          </PortalSurface>

          <PortalSurface className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-blue-400/25 bg-blue-500/10 text-blue-400">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-100">Cuenta verificada</p>
                <p className="truncate text-xs text-slate-400">{usuario.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.perfil)}
              aria-label="Ir a editar mis datos"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-slate-300/[0.14] bg-[#070b14] text-slate-300 transition-[border-color,color,transform] duration-150 hover:border-blue-400/45 hover:text-blue-300 active:scale-[0.95] cursor-pointer"
            >
              <Pencil size={12} />
            </button>
          </PortalSurface>
        </div>

        {/* Columna derecha (7/12): Accesos operativos afilados + Ficha personal */}
        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accesosClub.map(({ titulo, descripcion, icon: Icon, to }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="group flex flex-col justify-between rounded-md border border-slate-300/[0.10] bg-[#0a101b] p-4 text-left transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-blue-400/40 hover:bg-[#0f1829] active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-blue-400/25 bg-blue-500/10 text-blue-400 transition-colors group-hover:border-blue-400/45 group-hover:bg-blue-500/20">
                    <Icon size={16} />
                  </div>
                  <ArrowUpRight
                    size={15}
                    className="text-slate-500 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-400"
                  />
                </div>
                <div className="mt-3.5">
                  <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{descripcion}</p>
                </div>
              </button>
            ))}
          </div>

          <PortalSurface className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                Ficha personal
              </h2>
              <p className="text-xs text-slate-400">
                ¿Necesitás actualizar un dato?{' '}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.perfil)}
                  className="font-medium text-blue-400 underline decoration-blue-400/40 underline-offset-4 transition-colors hover:text-blue-300 cursor-pointer"
                >
                  Editar perfil
                </button>
              </p>
            </div>

            <dl className="divide-y divide-slate-300/[0.08] border-t border-slate-300/[0.08]">
              {filasDatos.map(({ etiqueta, valor, editable, tabular }) => (
                <div
                  key={etiqueta}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <dt className="min-w-[140px] text-xs font-medium text-slate-400">
                      {etiqueta}
                    </dt>
                    <dd
                      className={`font-medium text-slate-100 ${tabular ? 'tabular-nums' : ''}`}
                    >
                      {valor}
                    </dd>
                  </div>

                  {editable && (
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.perfil)}
                      className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>
              ))}
            </dl>
          </PortalSurface>
        </div>
      </div>
    </div>
  );
}
