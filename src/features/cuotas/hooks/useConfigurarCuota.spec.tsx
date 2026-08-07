import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { cuotasApi } from '../api/cuotas.api';
import { useConfigurarCuota } from './useConfigurarCuota';

vi.mock('../api/cuotas.api', () => ({
  cuotasApi: {
    create: vi.fn(),
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

describe('useConfigurarCuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía la configuración y confirma con un toast de éxito', async () => {
    const payload = { disciplinaId: 1, categoriaId: 1, monto: 15000 };
    (cuotasApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => useConfigurarCuota(), { wrapper: createWrapper() });

    await result.current.mutateAsync(payload);

    expect(cuotasApi.create).toHaveBeenCalledWith(payload, expect.anything());
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cuota configurada exitosamente');
    });
  });

  it('envía el período de aplicación cuando se indica', async () => {
    const payload = { disciplinaId: 1, categoriaId: 1, monto: 15000, periodoAplicacion: '2026-09' };
    (cuotasApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => useConfigurarCuota(), { wrapper: createWrapper() });

    await result.current.mutateAsync(payload);

    expect(cuotasApi.create).toHaveBeenCalledWith(payload, expect.anything());
  });

  it('muestra el mensaje de error de la API cuando el monto es inválido', async () => {
    (cuotasApi.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('El monto debe ser mayor a cero'),
    );

    const { result } = renderHook(() => useConfigurarCuota(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ disciplinaId: 1, categoriaId: 1, monto: 0 }),
    ).rejects.toThrow('El monto debe ser mayor a cero');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El monto debe ser mayor a cero');
    });
  });
});
