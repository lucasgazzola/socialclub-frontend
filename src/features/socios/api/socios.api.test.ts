import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { sociosApi } from './socios.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('sociosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create() envía post a /socios', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 1 } });
    const payload = {
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '30111222',
      email: 'juan@test.com',
      categoriaId: 2,
    };
    const res = await sociosApi.create(payload as any);
    expect(apiClient.post).toHaveBeenCalledWith('/socios', payload);
    expect(res).toEqual({ id: 1 });
  });

  it('list() envía get con query params a /socios', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await sociosApi.list({ busqueda: 'Juan', categoriaId: 2, pagina: 1, porPagina: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/socios', {
      params: {
        busqueda: 'Juan',
        categoriaId: 2,
        estado: undefined,
        pagina: 1,
        porPagina: 10,
      },
    });
  });

  it('getById() envía get a /socios/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 5 } });
    const res = await sociosApi.getById(5);
    expect(apiClient.get).toHaveBeenCalledWith('/socios/5');
    expect(res).toEqual({ id: 5 });
  });

  it('registrarme() envía post a /socios/registrar', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.registrarme({ dni: '12345678', categoriaId: 1 });
    expect(apiClient.post).toHaveBeenCalledWith('/socios/registrar', {
      dni: '12345678',
      categoriaId: 1,
    });
  });

  it('updatePerfil() envía patch a /socios/perfil', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 10 } });
    const profileData = { telefono: '11223344' };
    await sociosApi.updatePerfil(profileData as any);
    expect(apiClient.patch).toHaveBeenCalledWith('/socios/perfil', profileData);
  });

  it('update() envía patch a /socios/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.update(10, { telefono: '998877' });
    expect(apiClient.patch).toHaveBeenCalledWith('/socios/10', { telefono: '998877' });
  });

  it('deactivate() envía delete a /socios/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.deactivate(10);
    expect(apiClient.delete).toHaveBeenCalledWith('/socios/10');
  });

  it('darseDeBaja() envía post a /socios/darse-de-baja', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.darseDeBaja();
    expect(apiClient.post).toHaveBeenCalledWith('/socios/darse-de-baja');
  });

  it('activate() envía patch a /socios/:id/activar', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.activate(10);
    expect(apiClient.patch).toHaveBeenCalledWith('/socios/10/activar');
  });

  it('reactivarme() envía post a /socios/reactivarme', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 10 } });
    await sociosApi.reactivarme();
    expect(apiClient.post).toHaveBeenCalledWith('/socios/reactivarme');
  });
});
