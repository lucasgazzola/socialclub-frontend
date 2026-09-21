import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
    titulo: 'Inscripción',
    descripcion: 'Gestión de las inscripciones de participantes a una o varias disciplinas.',
    icon: UserPlus,
    ruta: ROUTES.inscripcion,
    tag: 'Disciplinas 2026',
  },
];

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Pantalla principal segun el rol del usuario:
 * - ADMIN/COLABORADOR: panel de administración.
 * - SOCIO: pantalla principal de socio.
 * - Sin roles: pantalla neutra con la opción 'Hacerme socio'.
 */
export function DashboardPage() {
  const { usuario } = useAuth();

  if (usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'COLABORADOR')) {
    return <PanelAdministracion />;
  }

  if (usuario?.roles.includes('SOCIO')) {
    return <PanelSocio />;
  }

  return <PantallaNeutra />;
}

function PanelAdministracion() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header institucional */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15 mb-2">
            <Sparkles className="size-3" /> C.A. y B.S. Unión · Panel de Gestión
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Hola, {usuario?.nombre ?? usuario?.email}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenido al panel central de C.A. y B.S. Unión. Consultá el estado de la gestión y accedé a los módulos principales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.perfil)}>
            <User size={15} />
            Mi cuenta
          </Button>
        </div>
      </div>

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

/** Pantalla principal del socio */
function PanelSocio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const persona = usuario?.persona;
  const membresiaActiva = persona?.membresias?.find((m) => m.activo);

  if (!persona || !membresiaActiva) {
    // Por consistencia: rol SOCIO sin membresía activa (estado transitorio).
    return <PantallaNeutra />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 mb-2">
            Membresía Activa
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Hola, {usuario?.nombre ?? usuario?.email} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenido a tu espacio personal en SocialClub.
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.perfil)}>
          <User size={16} />
          Editar mis datos
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-700 ring-1 ring-brand-100">
            <Users size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">Categoría</h2>
          <p className="mt-1 text-base font-medium text-slate-700">{membresiaActiva.categoria?.nombre ?? '—'}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-700 ring-1 ring-brand-100">
            <CalendarDays size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">Socio desde</h2>
          <p className="mt-1 text-base font-medium text-slate-700">{formatearFecha(membresiaActiva.fechaAlta)}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-2.5 text-brand-700 ring-1 ring-brand-100">
            <CreditCard size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">DNI</h2>
          <p className="mt-1 text-base font-medium text-slate-700">{persona.dni ?? '—'}</p>
        </Card>
      </div>
    </div>
  );
}

/** Pantalla para usuarios autenticados sin roles/Persona. */
function PantallaNeutra() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {usuario?.nombre ?? usuario?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Bienvenido a SocialClub.</p>
      </header>

      <Card className="max-w-xl p-6">
        <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
          <UserPlus size={20} />
        </div>
        <h2 className="text-lg font-medium text-slate-900">Sumate al club</h2>
        <p className="mt-1 text-sm text-slate-500">
          Hacete socio y accedé a los beneficios de la membresía del club.
        </p>
        <Button className="mt-4" onClick={() => navigate(ROUTES.hacermeSocio)}>
          <UserPlus size={16} />
          Hacerme socio
        </Button>
      </Card>
    </div>
  );
}
