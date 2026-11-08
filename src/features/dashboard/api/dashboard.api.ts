import { apiClient } from '@/lib/api/client';
import type { DashboardMetricas } from '../types/dashboard.types';

export const dashboardApi = {
  /** US-34 — Obtiene las métricas consolidadas del dashboard de gestión. */
  async getMetricas(): Promise<DashboardMetricas> {
    const { data } = await apiClient.get<DashboardMetricas>('/dashboard');
    return data;
  },
};
