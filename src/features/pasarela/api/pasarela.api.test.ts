import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { pasarelaApi } from './pasarela.api';
import { pagosApi } from '@/features/pagos/api/pagos.api';
import { entradasApi } from '@/features/entradas/api/entradas.api';
import { etiquetaMetodoPago } from '../types';

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const REF = '5f0c2c8e-7a51-4d0b-9f43-2a1b3c4d5e6f';

describe('TASK-51 · API de la pasarela', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: { referencia: REF } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { referencia: REF } });
  });

  it('consulta, confirma, cancela y simula órdenes', async () => {
    await pasarelaApi.obtener(REF);
    await pasarelaApi.confirmar(REF, '999');
    await pasarelaApi.confirmar(REF);
    await pasarelaApi.cancelar(REF);
    await pasarelaApi.simular(REF, true);

    expect(apiClient.get).toHaveBeenCalledWith(`/pasarela/ordenes/${REF}`);
    expect(apiClient.post).toHaveBeenCalledWith(`/pasarela/ordenes/${REF}/confirmar`, { idPago: '999' });
    expect(apiClient.post).toHaveBeenCalledWith(`/pasarela/ordenes/${REF}/confirmar`, {});
    expect(apiClient.post).toHaveBeenCalledWith(`/pasarela/ordenes/${REF}/cancelar`);
    expect(apiClient.post).toHaveBeenCalledWith(`/pasarela/ordenes/${REF}/simular`, { aprobado: true });
  });

  it('los dominios inician sus órdenes con su propio checkout', async () => {
    await expect(pagosApi.iniciarPagoCuotas(['2026-10'])).resolves.toEqual({ referencia: REF });
    await entradasApi.iniciarCompra({ eventoId: 1, cantidad: 2 });

    expect(apiClient.post).toHaveBeenCalledWith('/pagos/checkout', { periodos: ['2026-10'] });
    expect(apiClient.post).toHaveBeenCalledWith('/entradas/checkout', { eventoId: 1, cantidad: 2 });
  });

  it('traduce el método de pago a un nombre legible', () => {
    expect(etiquetaMetodoPago('MERCADO_PAGO')).toBe('Mercado Pago');
    expect(etiquetaMetodoPago('SIMULADA')).toBe('Pago simulado');
    expect(etiquetaMetodoPago('EFECTIVO')).toBe('Efectivo');
    expect(etiquetaMetodoPago('DESCONOCIDO')).toBe('DESCONOCIDO');
  });
});

describe('TASK-51 · breadcrumbs de las páginas de pago', () => {
  it('resultado y simulador cuelgan del inicio (no de una ruta /pagos inexistente)', async () => {
    const { resolverBreadcrumbs } = await import('@/components/ui/breadcrumbs.utils');
    expect(resolverBreadcrumbs('/pagos/resultado').map((b) => b.label)).toEqual([
      'Inicio',
      'Resultado del Pago',
    ]);
    expect(resolverBreadcrumbs('/pagos/simulador').map((b) => b.label)).toEqual([
      'Inicio',
      'Simulador de Pago',
    ]);
  });
});
