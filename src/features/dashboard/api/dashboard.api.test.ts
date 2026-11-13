import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { dashboardApi } from './dashboard.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMetricas() realiza un GET a /dashboard y retorna los datos', async () => {
    const mockMetricas = {
      totalIntegrantesActivos: 120,
      porcentajeMorosos: 8.3,
      cantidadMorosos: 10,
      documentosPorVencer: 4,
      inscripcionesIrregulares: { total: 3, pendientes: 2, bloqueadas: 1 },
      proximosEventos: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockMetricas });

    const resultado = await dashboardApi.getMetricas();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard');
    expect(resultado).toEqual(mockMetricas);
  });
});
