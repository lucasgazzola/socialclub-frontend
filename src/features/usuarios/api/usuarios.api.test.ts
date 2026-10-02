import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { usuariosApi } from './usuarios.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usuariosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create() envía post a /usuarios', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 1 } });
    const payload = { email: 'admin@club.com', password: '123' } as any;
    const res = await usuariosApi.create(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios', payload);
    expect(res).toEqual({ id: 1 });
  });

  it('list() envía get con params a /usuarios', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await usuariosApi.list({ busqueda: 'Admin', estado: 'activos', pagina: 1, porPagina: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios', {
      params: {
        busqueda: 'Admin',
        rolId: undefined,
        estado: 'activos',
        pagina: 1,
        porPagina: 10,
      },
    });
  });

  it('getById() envía get a /usuarios/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 2 } });
    const res = await usuariosApi.getById(2);
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/2');
    expect(res).toEqual({ id: 2 });
  });

  it('update() envía patch a /usuarios/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 2 } });
    const payload = { email: 'new@club.com' } as any;
    const res = await usuariosApi.update(2, payload);
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/2', payload);
    expect(res).toEqual({ id: 2 });
  });

  it('deactivate() envía delete a /usuarios/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { id: 2 } });
    const res = await usuariosApi.deactivate(2);
    expect(apiClient.delete).toHaveBeenCalledWith('/usuarios/2');
    expect(res).toEqual({ id: 2 });
  });

  it('activate() envía patch a /usuarios/:id/activar', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 2 } });
    const res = await usuariosApi.activate(2);
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/2/activar');
    expect(res).toEqual({ id: 2 });
  });
});
