import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  KeyRound,
  Pencil,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { formatearDni } from '@/lib/utils/dni';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import { AlertasDocumentacion } from '@/features/documentacion/components/AlertasDocumentacion';
import { ROUTES } from '@/routes/paths';

const modulos = [
  {
    titulo: 'Socios',
    descripcion: 'Alta, edición, baja y consulta de socios del club.',
    icon: Users,
    ruta: ROUTES.socios,
    tag: 'Padrón activo',
  },
  {
    titulo: 'Usuarios',
    descripcion: 'Gestión de usuarios administrativos y sus roles.',
    icon: ShieldCheck,
    ruta: ROUTES.usuarios,
    tag: 'Seguridad & Roles',
  },
  {
    titulo: 'Auditoría',
    descripcion: 'Registro inalterable de todas las operaciones del sistema.',
    icon: ScrollText,
    ruta: ROUTES.auditoria,
    tag: 'Trazabilidad',
  },
  {
    titulo: 'Participantes',
    descripcion: 'Inscripciones de participantes a una o varias disciplinas y su documentación.',
    icon: UserPlus,
    ruta: ROUTES.participantes,
    tag: 'Disciplinas 2026',
  },
];

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Pantalla principal segun el rol del usuario:
 * - ADMIN/COLABORADOR: panel de administración (ADMIN ve además las alertas de documentación).
 * - DELEGADO: alertas de documentación (US-26) y acceso a participantes.
 * - SOCIO: pantalla principal de socio.
 * - Sin roles: pantalla neutra con la opción 'Hacerme socio'.
 */
export function DashboardPage() {
  const { usuario } = useAuth();

  if (usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'COLABORADOR')) {
    return <PanelAdministracion />;
  }

  if (usuario?.roles.includes('DELEGADO')) {
    return <PanelDelegado />;
  }

  if (usuario?.roles.includes('SOCIO')) {
    return <PanelSocio />;
  }

  return <PantallaNeutra />;
}

function PanelAdministracion() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const veAlertas = usuario?.roles.includes('ADMIN');

  return (
    <div className="space-y-8">
      {/* Header institucional */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15 mb-2">
            <Sparkles className="size-3" /> SocialClub · Panel de Gestión
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hola, {usuario?.nombre ?? usuario?.email}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenido al panel central de SocialClub. Consultá el estado de la gestión y accedé a los módulos principales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.perfil)}>
            <User size={15} />
            Mi cuenta
          </Button>
        </div>
      </div>

      {veAlertas && <AlertasDocumentacion />}

      {/* Grid de módulos con estilo Apex */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Módulos del Sistema
          </h2>
          <span className="text-xs text-slate-400">4 módulos disponibles</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modulos.map(({ titulo, descripcion, icon: Icon, ruta, tag }) => (
            <Card
              key={titulo}
              onClick={() => ruta && navigate(ruta)}
              className="group relative cursor-pointer overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={20} />
                </div>
                <Badge variant="outline" className="text-[11px] font-normal">
                  {tag}
                </Badge>
              </div>

              <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
                {titulo}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                {descripcion}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-700 opacity-80 group-hover:opacity-100">
                <span>Acceder</span>
                <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/** US-26: Inicio del delegado, con las alertas de documentación al iniciar sesión. */
function PanelDelegado() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15 mb-2">
            <Sparkles className="size-3" /> SocialClub · Delegado
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hola, {usuario?.nombre ?? usuario?.email}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Revisá la documentación de los participantes antes de que se bloquee su inscripción.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.participantes)}>
          <UserPlus size={15} />
          Ver participantes
        </Button>
      </div>

      <AlertasDocumentacion />
    </div>
  );
}

/** Pantalla principal del socio */
function PanelSocio() {
  const { usuario } = useAuth();
  const persona = usuario?.persona;
  const membresiaActiva = persona?.membresias?.find((m) => m.activo);

  if (!persona || !membresiaActiva) {
    // Por consistencia: rol SOCIO sin membresía activa (estado transitorio).
    return <PantallaNeutra />;
  }

  return <VistaPortalIdentidad esSocio />;
}

/** Pantalla para participantes y usuarios autenticados sin membresía activa. */
function PantallaNeutra() {
  return <VistaPortalIdentidad esSocio={false} />;
}

interface FilaDatoPortal {
  etiqueta: string;
  valor: string;
  editable?: boolean;
}

/**
 * Vista principal del Portal SocialClub ID (para Socios y Participantes).
 * Presenta la tarjeta blanca de carnet/identidad a la izquierda y la ficha
 * de datos personales sobre fondo oscuro a la derecha.
 */
function VistaPortalIdentidad({ esSocio }: { esSocio: boolean }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const persona = usuario.persona;
  const membresiaActiva = esSocio ? persona?.membresias?.find((m) => m.activo) : undefined;

  const nombre = usuario.nombre ?? persona?.nombre ?? '';
  const apellido = usuario.apellido ?? persona?.apellido ?? '';
  const nombreMostrado =
    apellido && nombre
      ? `${apellido}, ${nombre}`
      : nombre || usuario.email;

  const iniciales =
    `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() ||
    usuario.email[0]?.toUpperCase() ||
    'SC';

  const filasDatos: FilaDatoPortal[] = [
    { etiqueta: 'Nombre', valor: nombre || '—' },
    { etiqueta: 'Apellido', valor: apellido || '—' },
    {
      etiqueta: 'Documento',
      valor: persona?.dni ? formatearDni(persona.dni) : 'Sin DNI registrado',
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
    },
    {
      etiqueta: 'Teléfono',
      valor: persona?.telefono || 'No registrado',
      editable: true,
    },
    {
      etiqueta: 'Mail',
      valor: usuario.email,
      editable: true,
    },
  ];

  const accionesRapidas = membresiaActiva
    ? [
        {
          label: 'VER MIS CUOTAS',
          icon: CreditCard,
          to: ROUTES.misCuotas,
          className: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
        },
        {
          label: 'RESERVAR ESPACIO',
          icon: CalendarClock,
          to: ROUTES.misReservas,
          className: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
        },
        {
          label: 'MIS ENTRADAS',
          icon: Ticket,
          to: ROUTES.misEntradas,
          className: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
        },
      ]
    : [
        {
          label: 'QUIERO HACERME SOCIO',
          icon: UserPlus,
          to: ROUTES.hacermeSocio,
          className: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
        },
        {
          label: 'INSCRIBIRME A DISCIPLINA',
          icon: Dumbbell,
          to: ROUTES.solicitarInscripcion,
          className: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
        },
        {
          label: 'EXPLORAR EVENTOS',
          icon: CalendarDays,
          to: ROUTES.eventos,
          className: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
        },
      ];

  return (
    <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[310px_minmax(0,1fr)]">
      {/* Tarjeta Blanca Central: Carnet Digital y Acciones Rápidas */}
      <section
        aria-label="Tarjeta de identidad del socio"
        className="flex flex-col items-center rounded-2xl bg-white p-7 text-center text-slate-900 shadow-2xl ring-1 ring-white/15"
      >
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-500 ring-4 ring-brand-50">
            {iniciales}
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.perfil)}
            title="Editar mis datos"
            aria-label="Ir a editar mis datos"
            className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition-transform hover:scale-105 hover:bg-brand-600 cursor-pointer"
          >
            <Pencil size={13} />
          </button>
        </div>

        <h1 className="mt-5 text-lg font-bold tracking-tight text-brand-700">
          {nombreMostrado}
        </h1>

        <p className="mt-1 text-sm font-medium text-slate-500">
          {membresiaActiva
            ? `Socio · ${membresiaActiva.categoria?.nombre ?? 'Activo'}`
            : 'Participante'}
        </p>

        {membresiaActiva ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Membresía Activa
          </div>
        ) : (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sumate al club
          </p>
        )}

        <div className="mt-6 w-full space-y-2.5">
          {accionesRapidas.map(({ label, icon: Icon, to, className }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all cursor-pointer ${className}`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Ficha Derecha: Datos Personales sobre fondo oscuro */}
      <section aria-label="Datos personales" className="space-y-5">
        <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
          Tus datos personales se utilizan para tu carnet digital, inscripciones a disciplinas y
          reservas en SocialClub. En caso de que necesites actualizar algún dato, hacé{' '}
          <button
            type="button"
            onClick={() => navigate(ROUTES.perfil)}
            className="font-semibold text-brand-400 underline decoration-brand-400/60 underline-offset-2 transition-colors hover:text-brand-300 cursor-pointer"
          >
            click aquí
          </button>{' '}
          para actualizarlos en tu perfil.
        </p>

        <dl className="divide-y divide-white/15 border-t border-b border-white/15">
          {filasDatos.map(({ etiqueta, valor, editable }) => (
            <div
              key={etiqueta}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <dt className="font-semibold text-slate-300">{etiqueta}:</dt>
                <dd className="font-medium text-white">{valor}</dd>
              </div>

              {editable && (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.perfil)}
                  className="text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300 cursor-pointer"
                >
                  Editar
                </button>
              )}
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.perfil)}
            className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
          >
            <User size={15} />
            Editar mis datos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.cambiarContrasena)}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <KeyRound size={15} />
            Cambiar contraseña
          </Button>
        </div>
      </section>
    </div>
  );
}
