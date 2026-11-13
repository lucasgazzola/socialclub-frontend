import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { espaciosApi } from './espacios.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('US-55 · espaciosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list · consulta GET /espacios con filtros', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 1, nombre: 'Quincho' }] });

    const res = await espaciosApi.list({ tipo: 'SOCIAL', busqueda: 'Quincho' });

    expect(apiClient.get).toHaveBeenCalledWith('/espacios', {
      params: { tipo: 'SOCIAL', busqueda: 'Quincho' },
    });
    expect(res).toHaveLength(1);
  });

  it('getById · consulta GET /espacios/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 3, nombre: 'Cancha 1' } });

    const res = await espaciosApi.getById(3);

    expect(apiClient.get).toHaveBeenCalledWith('/espacios/3');
    expect(res.id).toBe(3);
  });

  it('create · envía POST /espacios con el payload del espacio', async () => {
    const payload = {
      nombre: 'Cancha de Fútbol 5',
      tipo: 'DEPORTIVO' as const,
      capacidadMaxima: 10,
      modalidad: 'POR_HORA' as const,
      precio: 15000,
      montoSena: 5000,
      disciplinaIds: [1],
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 10, ...payload } });

    const res = await espaciosApi.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/espacios', payload);
    expect(res.id).toBe(10);
  });

  it('agregarBloqueo · envía POST /espacios/:id/bloqueos', async () => {
    const payload = {
      tipo: 'PUNTUAL' as const,
      fecha: '2026-11-25',
      motivo: 'Mantenimiento',
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 99, espacioId: 5, ...payload } });

    const res = await espaciosApi.agregarBloqueo(5, payload);

    expect(apiClient.post).toHaveBeenCalledWith('/espacios/5/bloqueos', payload);
    expect(res.id).toBe(99);
  });

  it('reactivar · envía PATCH /espacios/:id/reactivar', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { mensaje: 'Espacio reactivado exitosamente', id: 7 },
    });

    const res = await espaciosApi.reactivar(7);

    expect(apiClient.patch).toHaveBeenCalledWith('/espacios/7/reactivar');
    expect(res.id).toBe(7);
  });

  it('remove · envía DELETE /espacios/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      data: { mensaje: 'Espacio dado de baja exitosamente', id: 7 },
    });

    const res = await espaciosApi.remove(7);

    expect(apiClient.delete).toHaveBeenCalledWith('/espacios/7');
    expect(res.id).toBe(7);
  });
});
