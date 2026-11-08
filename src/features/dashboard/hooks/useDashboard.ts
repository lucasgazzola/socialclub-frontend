import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import type { DashboardMetricas } from '../types/dashboard.types';

/** Tiempo de vigencia en caché de las métricas del dashboard (30 segundos · US-34 Sección 7.1). */
export const DASHBOARD_STALE_TIME_MS = 30 * 1000;

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metricas: () => [...dashboardKeys.all, 'metricas'] as const,
};

/**
 * US-34 — Hook para consultar las métricas del dashboard administrativo.
 * Re-fetching al ingresar, al recuperar foco de ventana y con staleTime de 30s.
 */
export function useDashboard(enabled = true) {
  return useQuery<DashboardMetricas>({
    queryKey: dashboardKeys.metricas(),
    queryFn: () => dashboardApi.getMetricas(),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    refetchOnWindowFocus: true,
  });
}
