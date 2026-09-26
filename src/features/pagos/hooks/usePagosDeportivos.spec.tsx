import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { pagosApi } from '../api/pagos.api';
import { usePendientesDeportivos, useRegistrarPagoDeportivo } from './usePagosDeportivos';

vi.mock('../api/pagos.api', () => ({
  pagosApi: {
    getPendientesDeportivos: vi.fn(),
    registrarPagoDeportivo: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  return function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('US-21 · usePagosDeportivos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no consulta pendientes cuando no hay personaId', () => {
    renderHook(() => usePendientesDeportivos(null), { wrapper: createWrapper() });
    expect(pagosApi.getPendientesDeportivos).not.toHaveBeenCalled();
  });

  it('consulta los pendientes deportivos cuando hay personaId', async () => {
    (pagosApi.getPendientesDeportivos as ReturnType<typeof vi.fn>).mockResolvedValue({
      personaId: 50,
      estadoDeuda: 'MOROSO',
      cuotasPendientes: [],
      totalAdeudado: 0,
    });
    const { result } = renderHook(() => usePendientesDeportivos(50), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pagosApi.getPendientesDeportivos).toHaveBeenCalledWith(50);
  });

  it('registra el pago deportivo y dispara toast.success', async () => {
    const payload = { disciplinaId: 3, periodos: ['2026-08'], metodoPago: 'EFECTIVO' as const };
    (pagosApi.registrarPagoDeportivo as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensaje: '¡Pago de cuota deportiva registrado!',
      estadoDeudaActual: 'AL_DIA',
      cuotasPendientesRestantes: 0,
    });
    const { result } = renderHook(() => useRegistrarPagoDeportivo(50), { wrapper: createWrapper() });
    await result.current.mutateAsync(payload);
    expect(pagosApi.registrarPagoDeportivo).toHaveBeenCalledWith(50, payload);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('¡Pago de cuota deportiva registrado!'),
    );
  });

  it('falla si no se provee un personaId válido', async () => {
    const { result } = renderHook(() => useRegistrarPagoDeportivo(null), {
      wrapper: createWrapper(),
    });
    await expect(
      result.current.mutateAsync({ disciplinaId: 3, periodos: ['2026-08'], metodoPago: 'EFECTIVO' }),
    ).rejects.toThrow('Identificador de participante inválido.');
  });
});
