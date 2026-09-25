import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { useRegistrarPagoSocio } from './useRegistrarPagoSocio';

vi.mock('../api/pagos.api', () => ({
  pagosApi: {
    registrarPagoSocio: vi.fn(),
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

describe('US-17 · useRegistrarPagoSocio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra el pago en secretaría exitosamente y dispara toast.success', async () => {
    const payload = {
      periodos: ['2026-08', '2026-09'],
      metodoPago: 'EFECTIVO' as const,
      observaciones: 'Cobro en ventanilla',
    };

    (pagosApi.registrarPagoSocio as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensaje: '¡Pago registrado exitosamente!',
      estadoFinancieroActual: 'AL_DIA',
      cuotasPendientesRestantes: 0,
      pagos: [],
    });

    const { result } = renderHook(() => useRegistrarPagoSocio(20), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(payload);

    expect(pagosApi.registrarPagoSocio).toHaveBeenCalledWith(20, payload);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('¡Pago registrado exitosamente!');
    });
  });

  it('lanza error y muestra toast.error si la API rechaza el pago', async () => {
    (pagosApi.registrarPagoSocio as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('El socio no posee deudas en los períodos indicados.'),
    );

    const { result } = renderHook(() => useRegistrarPagoSocio(20), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        periodos: ['2026-08'],
        metodoPago: 'EFECTIVO',
      }),
    ).rejects.toThrow('El socio no posee deudas en los períodos indicados.');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'El socio no posee deudas en los períodos indicados.',
      );
    });
  });

  it('falla inmediatamente si no se provee un socioId válido', async () => {
    const { result } = renderHook(() => useRegistrarPagoSocio(null), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        periodos: ['2026-08'],
        metodoPago: 'EFECTIVO',
      }),
    ).rejects.toThrow('Identificador de socio inválido.');
  });
});
