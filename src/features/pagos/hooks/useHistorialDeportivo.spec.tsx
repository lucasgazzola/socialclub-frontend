import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { pagosApi } from '../api/pagos.api';
import { useHistorialDeportivo } from './useHistorialDeportivo';

vi.mock('../api/pagos.api', () => ({
  pagosApi: { getHistorialDeportivo: vi.fn() },
}));

function createWrapper() {
  return function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('US-22 · useHistorialDeportivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no consulta el historial sin personaId', () => {
    renderHook(() => useHistorialDeportivo(null), { wrapper: createWrapper() });
    expect(pagosApi.getHistorialDeportivo).not.toHaveBeenCalled();
  });

  it('consulta el historial con el filtro de fechas', async () => {
    (pagosApi.getHistorialDeportivo as ReturnType<typeof vi.fn>).mockResolvedValue({
      personaId: 50,
      estadoDeuda: 'AL_DIA',
      pagos: [],
      adeudados: [],
      totalPagado: 0,
      totalAdeudado: 0,
    });
    const { result } = renderHook(
      () => useHistorialDeportivo(50, { desde: '2026-01-01', hasta: '2026-01-31' }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pagosApi.getHistorialDeportivo).toHaveBeenCalledWith(50, {
      desde: '2026-01-01',
      hasta: '2026-01-31',
    });
  });
});
