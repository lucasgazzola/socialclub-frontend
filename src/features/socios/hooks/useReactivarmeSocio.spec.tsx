import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { sociosApi } from '../api/socios.api';
import { useReactivarmeSocio } from './useReactivarmeSocio';

const mockRefrescar = vi.fn();

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    refrescar: mockRefrescar,
  }),
}));

vi.mock('../api/socios.api', () => ({
  sociosApi: {
    reactivarme: vi.fn(),
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

describe('US-43 · useReactivarmeSocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('procesa la auto-reactivación exitosamente, refresca el perfil y dispara toast.success', async () => {
    (sociosApi.reactivarme as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      nombre: 'Lucas',
      apellido: 'Gazzola',
      activo: true,
    });

    const { result } = renderHook(() => useReactivarmeSocio(), { wrapper: createWrapper() });

    await result.current.mutateAsync();

    expect(sociosApi.reactivarme).toHaveBeenCalledTimes(1);
    expect(mockRefrescar).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Reactivación realizada con éxito. Tu membresía y beneficios fueron restablecidos.',
      );
    });
  });

  it('muestra el error en toast.error si falla la llamada API', async () => {
    (sociosApi.reactivarme as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('El socio ya se encuentra activo'),
    );

    const { result } = renderHook(() => useReactivarmeSocio(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync()).rejects.toThrow(
      'El socio ya se encuentra activo',
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El socio ya se encuentra activo');
    });
  });
});
