import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MisCuotasPage } from './MisCuotasPage';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { useHistorialPagos } from '../hooks/useHistorialPagos';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('../hooks/useMisCuotas', () => ({
  useMisCuotas: vi.fn(),
}));

vi.mock('../hooks/useHistorialPagos', () => ({
  useHistorialPagos: vi.fn(),
}));

const mockIniciarPago = vi.fn();
vi.mock('../hooks/useIniciarPagoCuotas', () => ({
  useIniciarPagoCuotas: vi.fn(() => ({
    mutateAsync: mockIniciarPago,
    isPending: false,
  })),
}));

const mockIrAPagar = vi.fn();
vi.mock('@/features/pasarela/hooks/usePasarela', () => ({
  irAPagar: (url: string) => mockIrAPagar(url),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MisCuotasPage />
    </MemoryRouter>,
  );
}

describe('MisCuotasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deshabilita las consultas HTTP si el usuario nunca fue socio', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: {
        id: 1,
        email: 'user@test.com',
        roles: ['ADMIN'],
        persona: null,
      },
    } as never);

    vi.mocked(useMisCuotas).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useHistorialPagos).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as never);

    renderPage();

    expect(useMisCuotas).toHaveBeenCalledWith({ enabled: false });
    expect(useHistorialPagos).toHaveBeenCalledWith({ enabled: false });
  });

  it('habilita las consultas HTTP y muestra datos si el usuario es o fue socio', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: {
        id: 2,
        email: 'socio@test.com',
        roles: ['SOCIO'],
        persona: {
          id: 10,
          membresias: [
            {
              id: 100,
              categoriaId: 1,
              fechaAlta: '2026-01-01',
              activo: true,
            },
          ],
        },
      },
    } as never);

    vi.mocked(useMisCuotas).mockReturnValue({
      data: {
        socioNombre: 'Juan Pérez',
        categoria: 'Pleno',
        estadoFinanciero: 'AL_DIA',
        cuotasPendientes: [],
      },
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useHistorialPagos).mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderPage();

    expect(useMisCuotas).toHaveBeenCalledWith({ enabled: true });
    expect(useHistorialPagos).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  describe('TASK-51 · pago online', () => {
    function socioConDeuda() {
      vi.mocked(useAuth).mockReturnValue({
        usuario: {
          id: 2,
          roles: ['SOCIO'],
          persona: { id: 10, membresias: [{ id: 100, activo: true }] },
        },
      } as never);
      vi.mocked(useMisCuotas).mockReturnValue({
        data: {
          socioNombre: 'Juan Pérez',
          categoria: 'Pleno',
          estadoFinanciero: 'MOROSO',
          cuotasPendientes: [
            { periodo: '2026-09', monto: 12000, categoriaNombre: 'Pleno' },
            { periodo: '2026-10', monto: 12000, categoriaNombre: 'Pleno' },
          ],
        },
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(useHistorialPagos).mockReturnValue({
        data: [
          { id: 7, periodo: '2026-08', monto: 12000, fechaPago: '2026-08-05', metodoPago: 'MERCADO_PAGO' },
        ],
        isLoading: false,
      } as never);
    }

    it('TC-258 · confirma el pago de las cuotas elegidas y redirige a la pasarela', async () => {
      const user = userEvent.setup();
      socioConDeuda();
      mockIniciarPago.mockResolvedValueOnce({ referencia: 'ref-1', urlPago: 'https://mp/checkout' });

      renderPage();
      await user.click(screen.getAllByRole('checkbox')[1]);
      await user.click(screen.getByRole('button', { name: /Pagar seleccionadas/i }));

      expect(screen.getByText('Confirmar pago')).toBeInTheDocument();
      await user.click(screen.getByTestId('pagar-ir-a-pasarela'));

      await waitFor(() => expect(mockIrAPagar).toHaveBeenCalledWith('https://mp/checkout'));
      expect(mockIniciarPago).toHaveBeenCalledWith([expect.stringMatching(/^2026-(09|10)$/)]);
    });

    it('muestra el error si no se puede iniciar el pago', async () => {
      const user = userEvent.setup();
      socioConDeuda();
      mockIniciarPago.mockRejectedValueOnce(new Error('La pasarela de pagos no respondió.'));

      renderPage();
      await user.click(screen.getAllByRole('checkbox')[1]);
      await user.click(screen.getByRole('button', { name: /Pagar seleccionadas/i }));
      await user.click(screen.getByTestId('pagar-ir-a-pasarela'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('La pasarela de pagos no respondió.'),
      );
      expect(mockIrAPagar).not.toHaveBeenCalled();
    });

    it('el historial muestra el método de pago con su nombre legible', async () => {
      const user = userEvent.setup();
      socioConDeuda();

      renderPage();
      await user.click(screen.getByRole('button', { name: /Historial de pagos/i }));

      expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
    });
  });
});
