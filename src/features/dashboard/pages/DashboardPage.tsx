import { useEffect } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  RefreshCw,
  Sparkles,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatearDni } from '@/lib/utils/dni';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AlertasDocumentacion } from '@/features/documentacion/components/AlertasDocumentacion';
import { ROUTES } from '@/routes/paths';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { DashboardProximosEventos } from '../components/DashboardProximosEventos';
import { useDashboard } from '../hooks/useDashboard';
import { formatearHoraActualizacion } from '../utils/dashboard.utils';

function formatearFecha(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Pantalla principal según el rol del usuario:
 * - ADMIN/COLABORADOR: dashboard ejecutivo con indicadores clave (US-34) y alertas de documentación para ADMIN (US-26).
 * - DELEGADO: alertas de documentación (US-26) y acceso a participantes (en `/`); sin acceso a `/dashboard`.
 * - SOCIO: pantalla principal de socio (en `/`); redirigido a `/mi-perfil` si intenta ingresar a `/dashboard`.
 * - Sin roles: pantalla neutra con la opción 'Hacerme socio'.
 */
export function DashboardPage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const esAutorizadoDashboard = Boolean(
    usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'COLABORADOR'),
  );
  const enRutaExclusivaDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    if (enRutaExclusivaDashboard && usuario && !esAutorizadoDashboard) {
      toast.error('No posee permisos para acceder al dashboard de gestión de la organización');
      navigate('/mi-perfil', { replace: true });
    }
  }, [enRutaExclusivaDashboard, usuario, esAutorizadoDashboard, navigate]);

  if (enRutaExclusivaDashboard && usuario && !esAutorizadoDashboard) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700"
      >
        No posee permisos para acceder al dashboard de gestión de la organización
      </div>
    );
  }

  if (esAutorizadoDashboard) {
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

function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-skeleton"
      aria-busy="true"
      aria-label="Cargando métricas del dashboard"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="p-5">
            <div className="flex items-start justify-between">
              <div className="size-10 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-10 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PanelAdministracion() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const veAlertas = usuario?.roles.includes('ADMIN');
  const { data, isLoading, isError, isFetching, dataUpdatedAt, refetch } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Header institucional */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="bg-brand-50 text-brand-700 ring-brand-600/15 mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset">
            <Sparkles className="size-3" /> SocialClub · Panel de Gestión
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hola, {usuario?.nombre ?? usuario?.email}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenido al panel central de SocialClub. Consultá los indicadores clave y el estado
            general de la organización.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-slate-500">
              Última actualización: {formatearHoraActualizacion(dataUpdatedAt)}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.perfil)}>
            <User size={15} />
            Mi cuenta
          </Button>
        </div>
      </div>

      {/* Contenido principal del Dashboard (US-34) */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-8 text-center"
        >
          <AlertCircle className="size-8 text-rose-600" />
          <p className="text-sm font-medium text-rose-800">
            No se pudieron cargar las métricas del dashboard. Por favor, reintente en unos minutos.
          </p>
          <Button variant="danger" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="size-3.5" />
            Reintentar carga
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <DashboardKpiCards metricas={data} />
          <DashboardProximosEventos eventos={data.proximosEventos} />
        </div>
      )}

      {veAlertas && <AlertasDocumentacion />}
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
          <div className="bg-brand-50 text-brand-700 ring-brand-600/15 mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset">
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
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/15 ring-inset">
            Membresía Activa
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
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
          <div className="bg-brand-50 text-brand-700 ring-brand-100 mb-3 inline-flex rounded-xl p-2.5 ring-1">
            <Users size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">Categoría</h2>
          <p className="mt-1 text-base font-medium text-slate-700">
            {membresiaActiva.categoria?.nombre ?? '—'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="bg-brand-50 text-brand-700 ring-brand-100 mb-3 inline-flex rounded-xl p-2.5 ring-1">
            <CalendarDays size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">Socio desde</h2>
          <p className="mt-1 text-base font-medium text-slate-700">
            {formatearFecha(membresiaActiva.fechaAlta)}
          </p>
        </Card>

        <Card className="p-5">
          <div className="bg-brand-50 text-brand-700 ring-brand-100 mb-3 inline-flex rounded-xl p-2.5 ring-1">
            <CreditCard size={20} />
          </div>
          <h2 className="font-semibold text-slate-900">DNI</h2>
          <p className="mt-1 text-base font-medium text-slate-700">{formatearDni(persona.dni)}</p>
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hola, {usuario?.nombre ?? usuario?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Bienvenido a SocialClub.</p>
      </header>

      <Card className="max-w-xl p-6">
        <div className="bg-brand-50 text-brand-700 mb-3 inline-flex rounded-lg p-2">
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
