import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { entradasApi } from './entradas.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('entradasApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crearEntradas realiza un POST a /entradas con eventoId y cantidad', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { eventoId: 1, cantidad: 2 } });
    const res = await entradasApi.crearEntradas(1, 2);
    expect(apiClient.post).toHaveBeenCalledWith('/entradas', { eventoId: 1, cantidad: 2 });
    expect(res).toEqual({ eventoId: 1, cantidad: 2 });
  });

  it('listarEntradasPorEvento realiza un GET a /entradas/evento/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    const res = await entradasApi.listarEntradasPorEvento(3);
    expect(apiClient.get).toHaveBeenCalledWith('/entradas/evento/3');
    expect(res).toEqual([]);
  });

  it('validarEntrada realiza un POST a /entradas/validar con token y eventoId', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { acceso: 'PERMITIDO' } });
    const res = await entradasApi.validarEntrada({ token: 'tok-abc', eventoId: 4 });
    expect(apiClient.post).toHaveBeenCalledWith('/entradas/validar', { token: 'tok-abc', eventoId: 4 });
    expect(res).toEqual({ acceso: 'PERMITIDO' });
  });

  it('iniciarCompra realiza un POST a /entradas/checkout', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 10 } });
    const res = await entradasApi.iniciarCompra({ eventoId: 1, cantidad: 3 });
    expect(apiClient.post).toHaveBeenCalledWith('/entradas/checkout', { eventoId: 1, cantidad: 3 });
    expect(res).toEqual({ id: 10 });
  });

  it('listarMisEntradas realiza un GET a /entradas/mis-entradas con query params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [], total: 0 } });
    const res = await entradasApi.listarMisEntradas({ page: 2, limit: 5, search: 'Fiesta' });
    expect(apiClient.get).toHaveBeenCalledWith('/entradas/mis-entradas', {
      params: { page: 2, limit: 5, search: 'Fiesta' },
    });
    expect(res).toEqual({ items: [], total: 0 });
  });
});

