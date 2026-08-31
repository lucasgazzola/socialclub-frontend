import { CalendarDays, CreditCard, ScrollText, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';

const modulos = [
  {
    titulo: 'Socios',
    descripcion: 'Alta, edición, baja y consulta de socios del club.',
    icon: Users,
  },
  {
    titulo: 'Usuarios',
    descripcion: 'Gestión de usuarios administrativos y sus roles.',
    icon: ShieldCheck,
  },
  {
    titulo: 'Auditoría',
    descripcion: 'Registro inalterable de todas las operaciones del sistema.',
    icon: ScrollText,
  },
  {
    titulo: 'Inscripción',
    descripcion: 'Gestión de las inscripciones de participantes a una o varias disciplinas.',
    icon: UserPlus,
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {usuario?.nombre ?? usuario?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bienvenido al panel de gestión de SocialClub.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map(({ titulo, descripcion, icon: Icon }) => (
          <Card key={titulo} className="p-5">
            <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
              <Icon size={20} />
            </div>
            <h2 className="font-medium text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Pantalla principal del socio */
function PanelSocio() {
  const { usuario } = useAuth();
  const persona = usuario?.persona;

  if (!persona) {
    // Por consistencia: rol SOCIO sin ficha asociada (estado transitorio).
    return <PantallaNeutra />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Hola, {usuario?.nombre ?? usuario?.email} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bienvenido a tu espacio de socio de SocialClub.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
            <Users size={20} />
          </div>
          <h2 className="font-medium text-slate-900">Categoría</h2>
          <p className="mt-1 text-sm text-slate-500">{persona.categoria?.nombre ?? '—'}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
            <CalendarDays size={20} />
          </div>
          <h2 className="font-medium text-slate-900">Socio desde</h2>
          <p className="mt-1 text-sm text-slate-500">{formatearFecha(persona.fechaAlta)}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-700">
            <CreditCard size={20} />
          </div>
          <h2 className="font-medium text-slate-900">DNI</h2>
          <p className="mt-1 text-sm text-slate-500">{persona.dni}</p>
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
