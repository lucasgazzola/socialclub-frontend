import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import {
  buscarParticipantePorDni,
  obtenerRequisitos,
  crearInscripcion,
  getInscripcion,
  getInscripcionesPorPersona,
  actualizarDatosPersona,
  actualizarInscripcion,
  listarInscripciones,
  darDeBajaParticipante,
  activarParticipante,
} from './inscripcion.api';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('inscripcion.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarParticipantePorDni() consulta /personas/dni/:dni', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 1, dni: '123' } });
    const res = await buscarParticipantePorDni('123');
    expect(apiClient.get).toHaveBeenCalledWith('/personas/dni/123');
    expect(res).toEqual({ id: 1, dni: '123' });
  });

  it('obtenerRequisitos() consulta /inscripcion/requisitos con params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { documentos: [] } });
    await obtenerRequisitos({ disciplinaId: 2, personaId: 5 });
    expect(apiClient.get).toHaveBeenCalledWith('/inscripcion/requisitos', {
      params: { disciplinaId: 2, personaId: 5 },
    });
  });

  it('crearInscripcion() envía post a /inscripcion', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 10 } });
    const payload = { disciplinaId: 1, personaId: 2 } as any;
    const res = await crearInscripcion(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/inscripcion', payload);
    expect(res).toEqual({ id: 10 });
  });

  it('getInscripcion() consulta /inscripcion/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 5 } });
    const res = await getInscripcion(5);
    expect(apiClient.get).toHaveBeenCalledWith('/inscripcion/5');
    expect(res).toEqual({ id: 5 });
  });

  it('getInscripcionesPorPersona() consulta /inscripcion/persona/:id con params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    await getInscripcionesPorPersona(10, true);
    expect(apiClient.get).toHaveBeenCalledWith('/inscripcion/persona/10', {
      params: { incluirBajas: true },
    });
  });

  it('actualizarDatosPersona() envía patch a /personas/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 10 } });
    const payload = { nombre: 'Carlos' } as any;
    const res = await actualizarDatosPersona(10, payload);
    expect(apiClient.patch).toHaveBeenCalledWith('/personas/10', payload);
    expect(res).toEqual({ id: 10 });
  });

  it('actualizarInscripcion() envía patch a /inscripcion/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 10 } });
    const payload = { disciplinaId: 2 } as any;
    const res = await actualizarInscripcion(10, payload);
    expect(apiClient.patch).toHaveBeenCalledWith('/inscripcion/10', payload);
    expect(res).toEqual({ id: 10 });
  });

  it('listarInscripciones() envía get a /inscripcion con params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { items: [], total: 0 } });
    await listarInscripciones({ busqueda: 'Ana', pagina: 1, porPagina: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/inscripcion', {
      params: {
        busqueda: 'Ana',
        disciplinaId: undefined,
        estado: undefined,
        pagina: 1,
        porPagina: 10,
      },
    });
  });

  it('darDeBajaParticipante() envía delete a /inscripcion/persona/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { ok: true } });
    const res = await darDeBajaParticipante(10);
    expect(apiClient.delete).toHaveBeenCalledWith('/inscripcion/persona/10');
    expect(res).toEqual({ ok: true });
  });

  it('activarParticipante() envía patch a /inscripcion/persona/:id/activar', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ok: true } });
    const res = await activarParticipante(10);
    expect(apiClient.patch).toHaveBeenCalledWith('/inscripcion/persona/10/activar');
    expect(res).toEqual({ ok: true });
  });
});
