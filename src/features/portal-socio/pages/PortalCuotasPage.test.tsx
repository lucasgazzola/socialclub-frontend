import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PortalCuotasPage } from './PortalCuotasPage';

const mockMisCuotas = vi.fn();
const mockDeportivas = vi.fn();
const mockIniciarDeportivo = vi.fn();

const socio = { id: 1, persona: { id: 10, membresias: [{ id: 1, activo: true }] } };
let mockUsuario: Record<string, unknown> = socio;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ usuario: mockUsuario }),
}));
vi.mock('@/features/pagos/hooks/useMisCuotas', () => ({
  useMisCuotas: (opciones?: { enabled?: boolean }) => mockMisCuotas(opciones),
}));
vi.mock('@/features/pagos/hooks/useIniciarPagoCuotas', () => ({
  useIniciarPagoCuotas: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/features/pagos/hooks/useHistorialPagos', () => ({
  useHistorialPagos: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/features/pagos/hooks/useMisCuotasDeportivas', () => ({
  useMisCuotasDeportivas: (opciones?: { enabled?: boolean }) => mockDeportivas(opciones),
  useIniciarPagoDeportivo: () => ({ mutateAsync: mockIniciarDeportivo, isPending: false }),
}));
vi.mock('@/features/pasarela/hooks/usePasarela', () => ({ irAPagar: vi.fn() }));

const alDia = {
  data: { cuotasPendientes: [], estadoFinanciero: 'AL_DIA', totalAdeudado: 0, categoria: 'General' },
  isLoading: false,
  isError: false,
};
const cuotaFutbol = {
  disciplinaId: 3,
  disciplinaNombre: 'Fútbol',
  categoriaNombre: 'Primera',
  periodo: '2026-10',
  monto: 12000,
};

describe('DT-35 · DT-63 · Mis cuotas del portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsuario = socio;
    mockMisCuotas.mockReturnValue(alDia);
  });

  it('sin deuda de ninguna cuota dice que está al día con sus cuotas', () => {
    mockDeportivas.mockReturnValue({ data: { cuotasPendientes: [] } });
    renderWithProviders(<PortalCuotasPage />);

    expect(screen.getByText('Estás al día con tus cuotas')).toBeInTheDocument();
  });

  it('al día con la social pero con deportivas pendientes, no dice «al día con tus cuotas»', () => {
    mockDeportivas.mockReturnValue({ data: { cuotasPendientes: [cuotaFutbol] } });
    renderWithProviders(<PortalCuotasPage />);

    expect(screen.getByText('Estás al día con la cuota social')).toBeInTheDocument();
    expect(screen.queryByText('Estás al día con tus cuotas')).not.toBeInTheDocument();
    expect(screen.getByText('Fútbol')).toBeInTheDocument();
  });

  it('paga los meses deportivos elegidos por la pasarela', async () => {
    const user = userEvent.setup();
    mockDeportivas.mockReturnValue({ data: { cuotasPendientes: [cuotaFutbol] } });
    mockIniciarDeportivo.mockResolvedValue({ referencia: 'R-1', urlPago: 'https://pago' });
    renderWithProviders(<PortalCuotasPage />);

    await user.click(screen.getByRole('button', { name: /Fútbol/ }));
    await user.click(screen.getByRole('button', { name: /Pagar disciplinas \(1\)/ }));
    await user.click(await screen.findByRole('button', { name: /Ir a pagar/ }));

    expect(mockIniciarDeportivo).toHaveBeenCalledWith([{ disciplinaId: 3, periodo: '2026-10' }]);
  });

  describe('DT-62 · participante que no es socio', () => {
    const participante = {
      id: 5,
      persona: { id: 30, membresias: [], tieneInscripciones: true },
    };

    it('ve y paga su cuota deportiva, sin la cuota social', async () => {
      const user = userEvent.setup();
      mockUsuario = participante;
      mockMisCuotas.mockReturnValue({ data: undefined, isLoading: false, isError: false });
      mockDeportivas.mockReturnValue({ data: { cuotasPendientes: [cuotaFutbol] }, isLoading: false });
      mockIniciarDeportivo.mockResolvedValue({ referencia: 'R-2', urlPago: 'https://pago' });
      renderWithProviders(<PortalCuotasPage />);

      expect(mockMisCuotas).toHaveBeenCalledWith({ enabled: false });
      expect(mockDeportivas).toHaveBeenCalledWith({ enabled: true });
      expect(screen.getByText('Cuota deportiva de tus disciplinas')).toBeInTheDocument();
      expect(screen.queryByText(/Saldo total adeudado/)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuota social/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Fútbol/ }));
      await user.click(screen.getByRole('button', { name: /Pagar disciplinas \(1\)/ }));
      await user.click(await screen.findByRole('button', { name: /Ir a pagar/ }));
      expect(mockIniciarDeportivo).toHaveBeenCalledWith([{ disciplinaId: 3, periodo: '2026-10' }]);
    });

    it('sin cuotas pendientes dice que está al día con sus disciplinas', () => {
      mockUsuario = participante;
      mockMisCuotas.mockReturnValue({ data: undefined, isLoading: false, isError: false });
      mockDeportivas.mockReturnValue({ data: { cuotasPendientes: [] }, isLoading: false });
      renderWithProviders(<PortalCuotasPage />);

      expect(screen.getByText('Estás al día con tus disciplinas')).toBeInTheDocument();
    });
  });
});
