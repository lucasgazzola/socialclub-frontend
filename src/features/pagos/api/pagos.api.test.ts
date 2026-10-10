import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { pagosApi } from './pagos.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe('pagos.api · US-23', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMorososCuotaDeportiva() consulta /pagos-deportivos/morosos con los filtros', async () => {
    const respuesta = { total: 0, deudaTotal: 0, diaVencimiento: 10, items: [] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: respuesta });

    const filtros = { disciplinaId: 2, ordenarPor: 'periodos' as const, orden: 'asc' as const };
    await expect(pagosApi.getMorososCuotaDeportiva(filtros)).resolves.toEqual(respuesta);

    expect(apiClient.get).toHaveBeenCalledWith('/pagos-deportivos/morosos', { params: filtros });
  });
});
