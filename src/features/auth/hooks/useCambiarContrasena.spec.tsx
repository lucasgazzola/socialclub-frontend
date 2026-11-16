import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api';
import { useCambiarContrasena } from './useCambiarContrasena';

vi.mock('../api/auth.api', () => ({
  authApi: {
    cambiarContrasena: vi.fn(),
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

const payload = {
  passwordActual: 'Socio123!',
  nuevaContrasena: 'Nueva123!',
  confirmarNuevaContrasena: 'Nueva123!',
};

describe('US-41 · useCambiarContrasena', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía el payload al endpoint de cambio y dispara toast.success', async () => {
    vi.mocked(authApi.cambiarContrasena).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCambiarContrasena(), { wrapper: createWrapper() });

    await result.current.mutateAsync(payload);

    expect(authApi.cambiarContrasena).toHaveBeenCalledTimes(1);
    expect(authApi.cambiarContrasena).toHaveBeenCalledWith(payload);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada correctamente.');
    });
  });

  it('propaga el mensaje del backend en toast.error si la contraseña actual es incorrecta', async () => {
    vi.mocked(authApi.cambiarContrasena).mockRejectedValue(
      new Error('La contraseña actual es incorrecta'),
    );

    const { result } = renderHook(() => useCambiarContrasena(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync(payload)).rejects.toThrow(
      'La contraseña actual es incorrecta',
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('La contraseña actual es incorrecta');
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('usa un mensaje genérico cuando el error no trae texto', async () => {
    vi.mocked(authApi.cambiarContrasena).mockRejectedValue(new Error(''));

    const { result } = renderHook(() => useCambiarContrasena(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync(payload)).rejects.toThrow();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Ocurrió un error al cambiar la contraseña. Intentá nuevamente.',
      );
    });
  });
});
