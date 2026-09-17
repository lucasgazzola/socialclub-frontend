import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { useRegistrarPago } from './useRegistrarPago';

vi.mock('../api/pagos.api', () => ({
  pagosApi: {
    registrarPago: vi.fn(),
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

describe('US-10 · useRegistrarPago', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('procesa el pago exitosamente y dispara toast.success', async () => {
    const payload = { periodos: ['2026-08', '2026-09'], metodoPago: 'MOCK_TARJETA' };
    (pagosApi.registrarPago as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensaje: '¡Pago registrado exitosamente!',
      estadoFinancieroActual: 'AL_DIA',
      cuotasPendientesRestantes: 0,
    });

    const { result } = renderHook(() => useRegistrarPago(), { wrapper: createWrapper() });

    await result.current.mutateAsync(payload);

    expect(pagosApi.registrarPago).toHaveBeenCalledWith(payload);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('¡Pago registrado exitosamente!');
    });
  });

  it('muestra el error retornado por la API vía toast.error si falla la mutación', async () => {
    (pagosApi.registrarPago as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('No es posible procesar el pago: el período ya figura como pagado.'),
    );

    const { result } = renderHook(() => useRegistrarPago(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ periodos: ['2026-09'] }),
    ).rejects.toThrow('No es posible procesar el pago: el período ya figura como pagado.');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No es posible procesar el pago: el período ya figura como pagado.',
      );
    });
  });
});
