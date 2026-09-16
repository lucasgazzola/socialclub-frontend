import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { activarParticipante } from '../api/inscripcion.api';
import { useActivarParticipante } from './useActivarParticipante';

vi.mock('../api/inscripcion.api', () => ({
  activarParticipante: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const apiMock = activarParticipante as unknown as ReturnType<typeof vi.fn>;

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

describe('US-07 · useActivarParticipante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reactiva al participante y lo confirma con un mensaje claro', async () => {
    apiMock.mockResolvedValue({ personaId: 10, activo: true });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivarParticipante(), { wrapper });

    await result.current.mutateAsync(10);

    expect(apiMock).toHaveBeenCalledWith(10);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'El participante fue reactivado: ya se lo puede inscribir de nuevo',
      );
    });
  });

  it('refresca el listado de participantes para que la fila quede Activa', async () => {
    apiMock.mockResolvedValue({ personaId: 10, activo: true });
    const { wrapper, invalidateQueries } = createWrapper();

    const { result } = renderHook(() => useActivarParticipante(), { wrapper });

    await result.current.mutateAsync(10);

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['inscripciones'] });
    });
  });

  it('informa el error del backend cuando no se puede reactivar', async () => {
    apiMock.mockRejectedValue(new Error('El participante ya está activo'));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivarParticipante(), { wrapper });

    await expect(result.current.mutateAsync(10)).rejects.toThrow('El participante ya está activo');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El participante ya está activo');
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('usa un mensaje genérico cuando el error no trae mensaje', async () => {
    apiMock.mockRejectedValue('Error desconocido');
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivarParticipante(), { wrapper });

    await expect(result.current.mutateAsync(10)).rejects.toBe('Error desconocido');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al reactivar al participante');
    });
  });
});