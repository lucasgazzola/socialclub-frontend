import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { reportesApi } from './reportes.api';

vi.mock('@/lib/api/client', () => ({ apiClient: { get: vi.fn() } }));

describe('reportes.api · US-35', () => {
  it('getEstadoFinanciero() consulta /reportes/estado-financiero con el período y la disciplina', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { totales: {} } });
    const filtros = { desde: '2026-07', hasta: '2026-09', disciplinaId: 2 };

    await reportesApi.getEstadoFinanciero(filtros);

    expect(apiClient.get).toHaveBeenCalledWith('/reportes/estado-financiero', { params: filtros });
  });
});

describe('reportes.api · US-36', () => {
  it('getAsistenciaEventos() consulta /reportes/asistencia-eventos con los filtros', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { totales: {}, eventos: [] } });
    const filtros = { eventoId: 5, desde: '2026-08-01', hasta: '2026-10-31', estado: 'FINALIZADO' };

    await reportesApi.getAsistenciaEventos(filtros);

    expect(apiClient.get).toHaveBeenCalledWith('/reportes/asistencia-eventos', { params: filtros });
  });
});
