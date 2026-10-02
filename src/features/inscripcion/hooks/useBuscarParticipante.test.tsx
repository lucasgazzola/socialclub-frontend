import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuscarParticipante } from './useBuscarParticipante';
import { buscarParticipantePorDni } from '../api/inscripcion.api';

vi.mock('../api/inscripcion.api', () => ({
  buscarParticipantePorDni: vi.fn(),
}));

describe('useBuscarParticipante', () => {
  it('retorna participante encontrado exitosamente', async () => {
    const mockParticipante = { id: 1, dni: '12345678', nombre: 'Juan' };
    vi.mocked(buscarParticipantePorDni).mockResolvedValueOnce(mockParticipante as any);

    const { result } = renderHook(() => useBuscarParticipante());

    expect(result.current.cargando).toBe(false);

    let res: any;
    await act(async () => {
      res = await result.current.buscar('12345678');
    });

    expect(buscarParticipantePorDni).toHaveBeenCalledWith('12345678');
    expect(res).toEqual({ participante: mockParticipante, noEncontrado: false });
    expect(result.current.participante).toEqual(mockParticipante);
    expect(result.current.noEncontrado).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maneja caso 404 participante no encontrado', async () => {
    const error404 = new Error('Not found (404)');
    (error404 as any).status = 404;
    vi.mocked(buscarParticipantePorDni).mockRejectedValueOnce(error404);

    const { result } = renderHook(() => useBuscarParticipante());

    let res: any;
    await act(async () => {
      res = await result.current.buscar('99999999');
    });

    expect(res).toEqual({ participante: null, noEncontrado: true });
    expect(result.current.participante).toBeNull();
    expect(result.current.noEncontrado).toBe(true);
  });

  it('maneja error genérico de red', async () => {
    vi.mocked(buscarParticipantePorDni).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBuscarParticipante());

    let res: any;
    await act(async () => {
      res = await result.current.buscar('12345678');
    });

    expect(res).toEqual({ participante: null, noEncontrado: false });
    expect(result.current.error).toBe('No se pudo buscar el participante. Intentá de nuevo.');

    // Limpiar estado
    act(() => {
      result.current.limpiar();
    });
    expect(result.current.error).toBeNull();
  });
});
