import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import type { DashboardMetricas } from '../types/dashboard.types';

/** Tiempo de vigencia en caché de las métricas del dashboard (5 minutos para no saturar el servidor). */
export const DASHBOARD_STALE_TIME_MS = 5 * 60 * 1000;

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metricas: () => [...dashboardKeys.all, 'metricas'] as const,
};

/**
 * US-34 — Hook para consultar las métricas del dashboard administrativo.
 * Conserva la caché durante 5 minutos para evitar peticiones innecesarias.
 * No re-fetchea automáticamente al cambiar de pestaña (`refetchOnWindowFocus: false`).
 * Solo se actualiza al vencer el staleTime (5 min) o cuando el usuario presiona el botón "Actualizar".
 */
export function useDashboard(enabled = true) {
  const query = useQuery<DashboardMetricas>({
    queryKey: dashboardKeys.metricas(),
    queryFn: () => dashboardApi.getMetricas(false),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  /** Forzar recálculo explícito ignorando la caché del backend (al pulsar botón Actualizar). */
  const refetch = async () => {
    await dashboardApi.getMetricas(true);
    return query.refetch();
  };

  return {
    ...query,
    refetch,
  };
}
