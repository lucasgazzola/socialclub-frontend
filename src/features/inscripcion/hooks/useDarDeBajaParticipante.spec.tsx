import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { darDeBajaParticipante } from '../api/inscripcion.api';
import { useDarDeBajaParticipante } from './useDarDeBajaParticipante';

vi.mock('../api/inscripcion.api', () => ({
  darDeBajaParticipante: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const apiMock = darDeBajaParticipante as unknown as ReturnType<typeof vi.fn>;

/** QueryClient con espía sobre la invalidación de cache. */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { wrapper, invalidateQueries };
}

const resultadoBaja = {
  personaId: 10,
  estado: 'BAJA' as const,
  disciplinasDadasDeBaja: 2,
  disciplinas: [
    { inscripcionId: 1, disciplinaId: 1, disciplina: 'Fútbol' },
    { inscripcionId: 2, disciplinaId: 2, disciplina: 'Vóley' },
  ],
};

describe('US-07 · useDarDeBajaParticipante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('da de baja al participante y lo confirma con un mensaje claro', async () => {
    apiMock.mockResolvedValue(resultadoBaja);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarDeBajaParticipante(), { wrapper });

    await result.current.mutateAsync(10);

    expect(apiMock).toHaveBeenCalledWith(10);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'El participante fue dado de baja y no podrá participar de ninguna disciplina',
      );
    });
  });

  it('refresca el listado de participantes para que la fila quede en Baja', async () => {
    apiMock.mockResolvedValue(resultadoBaja);
    const { wrapper, invalidateQueries } = createWrapper();

    const { result } = renderHook(() => useDarDeBajaParticipante(), { wrapper });

    await result.current.mutateAsync(10);

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['inscripciones'] });
    });
  });

  it('informa el error del backend cuando no se puede dar de baja', async () => {
    apiMock.mockRejectedValue(
      new Error('El participante ya está dado de baja: no tiene disciplinas activas'),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarDeBajaParticipante(), { wrapper });

    await expect(result.current.mutateAsync(10)).rejects.toThrow(
      'El participante ya está dado de baja: no tiene disciplinas activas',
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'El participante ya está dado de baja: no tiene disciplinas activas',
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('usa un mensaje genérico cuando el error no trae mensaje', async () => {
    apiMock.mockRejectedValue('Error desconocido');
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarDeBajaParticipante(), { wrapper });

    await expect(result.current.mutateAsync(10)).rejects.toBe('Error desconocido');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al dar de baja al participante');
    });
  });
});