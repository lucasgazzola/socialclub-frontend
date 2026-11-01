import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { reservasApi } from './reservas.api';

vi.mock('@/lib/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

describe('US-60/61/62 · API de reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const m of [apiClient.get, apiClient.post, apiClient.patch]) vi.mocked(m).mockResolvedValue({ data: {} });
  });

  it('llama a los endpoints de la administración', async () => {
    await reservasApi.solicitudes(['CANCELADA_USUARIO', 'CANCELADA_FALTA_PAGO'], 'Lucía');
    await reservasApi.aprobar(1);
    await reservasApi.rechazar(1, 'Motivo');
    await reservasApi.registrarSena(1, 'EFECTIVO');
    await reservasApi.cancelarPorInstitucion(1, 'Motivo');
    await reservasApi.cancelarPorFaltaPago(1);

    expect(apiClient.get).toHaveBeenCalledWith('/reservas/solicitudes', {
      params: { estado: 'CANCELADA_USUARIO,CANCELADA_FALTA_PAGO', busqueda: 'Lucía' },
    });
    expect(apiClient.patch).toHaveBeenCalledWith('/reservas/1/aprobar');
    expect(apiClient.patch).toHaveBeenCalledWith('/reservas/1/rechazar', { motivo: 'Motivo' });
    expect(apiClient.post).toHaveBeenCalledWith('/reservas/1/sena', { metodoPago: 'EFECTIVO' });
    expect(apiClient.post).toHaveBeenCalledWith('/reservas/1/cancelar-institucion', { motivo: 'Motivo' });
    expect(apiClient.post).toHaveBeenCalledWith('/reservas/1/cancelar-falta-pago');
  });

  it('llama a los endpoints del solicitante', async () => {
    await reservasApi.mias();
    await reservasApi.cancelar(2);
    await reservasApi.pagarSena(2);

    expect(apiClient.get).toHaveBeenCalledWith('/reservas/mias');
    expect(apiClient.post).toHaveBeenCalledWith('/reservas/2/cancelar');
    expect(apiClient.post).toHaveBeenCalledWith('/reservas/2/sena/checkout');
  });
});
