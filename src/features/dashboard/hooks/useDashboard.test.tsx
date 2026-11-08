import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { dashboardApi } from '../api/dashboard.api';
import { DASHBOARD_STALE_TIME_MS, dashboardKeys, useDashboard } from './useDashboard';

vi.mock('../api/dashboard.api', () => ({
  dashboardApi: {
    getMetricas: vi.fn(),
  },
}));

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta dashboardApi.getMetricas y configura staleTime entre 30 y 60 segundos', async () => {
    const mockData = {
      totalIntegrantesActivos: 42,
      porcentajeMorosos: 5.0,
      cantidadMorosos: 2,
      documentosPorVencer: 1,
      inscripcionesIrregulares: { total: 1, pendientes: 1, bloqueadas: 0 },
      proximosEventos: [],
    };
    vi.mocked(dashboardApi.getMetricas).mockResolvedValueOnce(mockData);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(dashboardApi.getMetricas).toHaveBeenCalledTimes(1);
    expect(DASHBOARD_STALE_TIME_MS).toBeGreaterThanOrEqual(30_000);
    expect(DASHBOARD_STALE_TIME_MS).toBeLessThanOrEqual(60_000);
    expect(dashboardKeys.metricas()).toEqual(['dashboard', 'metricas']);
  });
});
