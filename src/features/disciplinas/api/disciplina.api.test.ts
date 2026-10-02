import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import {
  listarDisciplinasActivas,
  listarDisciplinas,
  obtenerDisciplina,
  crearDisciplina,
  actualizarDisciplina,
  desactivarDisciplina,
  reactivarDisciplina,
} from './disciplina.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('disciplina.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listarDisciplinasActivas() consulta /disciplinas con filtro de estado ACTIVA', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { items: [{ id: 1, nombre: 'Tenis' }] },
    });
    const res = await listarDisciplinasActivas();
    expect(apiClient.get).toHaveBeenCalledWith('/disciplinas', {
      params: { estado: 'ACTIVA', pagina: 1, porPagina: 100 },
    });
    expect(res).toEqual([{ id: 1, nombre: 'Tenis' }]);
  });

  it('listarDisciplinas() consulta /disciplinas con params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { items: [], total: 0 },
    });
    const query = { busqueda: 'Futbol', pagina: 1, porPagina: 10 };
    await listarDisciplinas(query as any);
    expect(apiClient.get).toHaveBeenCalledWith('/disciplinas', { params: query });
  });

  it('obtenerDisciplina() consulta /disciplinas/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 3 } });
    const res = await obtenerDisciplina(3);
    expect(apiClient.get).toHaveBeenCalledWith('/disciplinas/3');
    expect(res).toEqual({ id: 3 });
  });

  it('crearDisciplina() envía post a /disciplinas', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 4 } });
    const payload = { nombre: 'Padel' } as any;
    const res = await crearDisciplina(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/disciplinas', payload);
    expect(res).toEqual({ id: 4 });
  });

  it('actualizarDisciplina() envía patch a /disciplinas/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 4 } });
    const payload = { nombre: 'Padel Pro' } as any;
    const res = await actualizarDisciplina(4, payload);
    expect(apiClient.patch).toHaveBeenCalledWith('/disciplinas/4', payload);
    expect(res).toEqual({ id: 4 });
  });

  it('desactivarDisciplina() envía delete a /disciplinas/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { id: 4 } });
    const res = await desactivarDisciplina(4);
    expect(apiClient.delete).toHaveBeenCalledWith('/disciplinas/4');
    expect(res).toEqual({ id: 4 });
  });

  it('reactivarDisciplina() envía patch a /disciplinas/:id/reactivar', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 4 } });
    const res = await reactivarDisciplina(4);
    expect(apiClient.patch).toHaveBeenCalledWith('/disciplinas/4/reactivar');
    expect(res).toEqual({ id: 4 });
  });
});
