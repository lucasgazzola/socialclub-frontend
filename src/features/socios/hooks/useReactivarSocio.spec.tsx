import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { sociosApi } from '../api/socios.api';
import { useReactivarSocio } from './useReactivarSocio';

vi.mock('../api/socios.api', () => ({
  sociosApi: {
    activate: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  return function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('US-43 · useReactivarSocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reactiva la membresía exitosamente y dispara toast.success', async () => {
    (sociosApi.activate as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      nombre: 'Carlos',
      apellido: 'Perez',
      activo: true,
    });

    const { result } = renderHook(() => useReactivarSocio(), { wrapper: createWrapper() });

    await result.current.mutateAsync(10);

    expect(sociosApi.activate).toHaveBeenCalledWith(10);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Membresía reactivada con éxito. El socio se encuentra nuevamente activo.',
      );
    });
  });

  it('muestra el error en toast.error si falla la llamada API', async () => {
    (sociosApi.activate as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('El socio ya se encuentra activo'),
    );

    const { result } = renderHook(() => useReactivarSocio(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync(10)).rejects.toThrow(
      'El socio ya se encuentra activo',
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El socio ya se encuentra activo');
    });
  });
});
