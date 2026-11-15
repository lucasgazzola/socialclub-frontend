import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { DashboardGraficos } from '../components/DashboardGraficos';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { DashboardProximosEventos } from '../components/DashboardProximosEventos';
import { useDashboard } from '../hooks/useDashboard';
import { formatearHoraActualizacion } from '../utils/dashboard.utils';

const MENSAJE_FALTA_PERMISOS =
  'No posee permisos para acceder al dashboard de gestión de la organización';

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2].map((chart) => (
          <Card key={chart} className="p-5">
            <div className="mb-4 h-4 w-44 animate-pulse rounded bg-slate-200" />
            <div className="h-56 w-full animate-pulse rounded-xl bg-slate-100" />
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

/**
 * US-34 — Página independiente del Dashboard de Gestión (`/dashboard`).
 * - Visible y accesible únicamente para usuarios con rol ADMIN o COLABORADOR.
 * - Usuarios con rol SOCIO o DELEGADO son redirigidos a `/mi-perfil` con mensaje de falta de permisos.
 * - Usuarios no autenticados (anónimos) son redirigidos a `/login`.
 */
export function DashboardGestionPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const esAutorizado = Boolean(
    usuario?.roles.some((rol) => rol === 'ADMIN' || rol === 'COLABORADOR'),
  );

  useEffect(() => {
    if (!usuario) {
      navigate(ROUTES.login, { replace: true });
      return;
    }

    if (!esAutorizado) {
      toast.error(MENSAJE_FALTA_PERMISOS);
      navigate('/mi-perfil', { replace: true });
    }
  }, [usuario, esAutorizado, navigate]);

  const { data, isLoading, isError, isFetching, dataUpdatedAt, refetch } =
    useDashboard(esAutorizado);

  if (!usuario) {
    return null;
  }

  if (!esAutorizado) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700"
      >
        {MENSAJE_FALTA_PERMISOS}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard de Gestión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visión general del estado operativo, financiero, documental y de eventos del club.
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
          <DashboardGraficos metricas={data} />
          <DashboardProximosEventos eventos={data.proximosEventos} />
        </div>
      )}
    </div>
  );
}
