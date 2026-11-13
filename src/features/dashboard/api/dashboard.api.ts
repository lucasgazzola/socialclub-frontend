import { apiClient } from '@/lib/api/client';
import type { DashboardMetricas } from '../types/dashboard.types';

export const dashboardApi = {
  /** US-34 — Obtiene las métricas consolidadas del dashboard de gestión. */
  async getMetricas(forzar = false): Promise<DashboardMetricas> {
    const url = forzar ? '/dashboard?forzar=true' : '/dashboard';
    const { data } = await apiClient.get<DashboardMetricas>(url);
    return data;
  },
};
