import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PortalEntradasPage } from './PortalEntradasPage';
import type { Entrada, FiltrosMisEntradas } from '@/features/entradas/types';

const mockUseMisEntradas = vi.fn();
vi.mock('@/features/entradas/hooks/useEntradas', () => ({
  useMisEntradas: (p?: FiltrosMisEntradas) => mockUseMisEntradas(p),
}));
vi.mock('../components/PortalQRCode', () => ({
  PortalQRCode: ({ value }: { value: string }) => <div data-testid="qr">{value}</div>,
}));
vi.mock('@/features/entradas/components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr-grande">{value}</div>,
}));
const mockTodas = vi.fn();
vi.mock('@/features/entradas/utils/descargarEntradaPdf', () => ({
  descargarEntradaPdf: vi.fn(),
  descargarTodasEntradasPdf: (...a: unknown[]) => mockTodas(...a),
  descargarQR: vi.fn(),
}));

const DIA = 24 * 60 * 60 * 1000;
const entrada = (id: number, extra: Partial<Entrada> = {}, ev: Record<string, unknown> = {}) =>
  ({
    id,
    token: `tok-${id}`,
    eventoId: 7,
    estado: 'VALIDA',
    creadoEn: '',
    ...extra,
    evento: { id: 7, nombre: 'Peña', estado: 'PUBLICADO', fechaEvento: new Date(Date.now() + DIA).toISOString(), lugarAcreditacion: 'Salón', ...ev },
  }) as Entrada;
const pagina = (items: Entrada[]) => ({ data: { items, total: items.length, pagina: 1, porPagina: 50, totalPaginas: 1 }, isLoading: false, isError: false });

describe('TASK-60 · DT-57 · Entradas del portal', () => {
  beforeEach(() => vi.clearAllMocks());

  function mockPestanias(proximas: Entrada[], historial: Entrada[]) {
    mockUseMisEntradas.mockImplementation((p?: FiltrosMisEntradas) =>
      p?.vigencia === 'HISTORIAL' ? pagina(historial) : pagina(proximas),
    );
  }

  it('usa la API paginada por vigencia y agrupa las entradas del mismo evento con carrusel', async () => {
    const user = userEvent.setup();
    mockPestanias([entrada(1), entrada(2)], []);
    renderWithProviders(<PortalEntradasPage />);

    expect(mockUseMisEntradas).toHaveBeenCalledWith(expect.objectContaining({ vigencia: 'PROXIMAS', limit: 50 }));
    const ticket = screen.getByRole('article', { name: 'Entradas para Peña' });
    expect(within(ticket).getByText('2 entradas')).toBeInTheDocument();
    expect(within(ticket).getByTestId('qr')).toHaveTextContent('tok-1');
    await user.click(within(ticket).getByRole('button', { name: 'Entrada siguiente' }));
    expect(within(ticket).getByTestId('qr')).toHaveTextContent('tok-2');

    await user.click(within(ticket).getByRole('button', { name: /PDF con todas/ }));
    expect(mockTodas).toHaveBeenCalled();
  });

  it('«Mostrar en la puerta» abre el QR a pantalla completa', async () => {
    const user = userEvent.setup();
    mockPestanias([entrada(1)], []);
    renderWithProviders(<PortalEntradasPage />);
    await user.click(screen.getByRole('button', { name: /Mostrar en la puerta/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Peña');
  });

  it('el historial diferencia usada, vencida y cancelada, con sello y sin descarga', async () => {
    const user = userEvent.setup();
    mockPestanias(
      [],
      [
        entrada(10, { estado: 'USADA', usadaEn: new Date().toISOString(), eventoId: 8 }, { id: 8, nombre: 'Cena' }),
        entrada(11, { estado: 'EXPIRADA', eventoId: 9 }, { id: 9, nombre: 'Torneo' }),
        entrada(12, { estado: 'EXPIRADA', eventoId: 10 }, { id: 10, nombre: 'Recital', estado: 'CANCELADO' }),
      ],
    );
    renderWithProviders(<PortalEntradasPage />);
    await user.click(screen.getByRole('tab', { name: /Historial/ }));

    expect(screen.getByTestId('entrada-badge-10')).toHaveTextContent('Usada');
    expect(screen.getByText(/^Usada el /)).toBeInTheDocument();
    expect(screen.getByTestId('entrada-badge-11')).toHaveTextContent('Vencida');
    expect(screen.getByTestId('entrada-badge-12')).toHaveTextContent('Cancelada');
    expect(screen.getByText('USADA')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mostrar en la puerta|PDF/ })).not.toBeInTheDocument();
  });

  it('sin entradas próximas invita a ver los eventos', () => {
    mockPestanias([], []);
    renderWithProviders(<PortalEntradasPage />);
    expect(screen.getByText('No tenés entradas para próximos eventos')).toBeInTheDocument();
  });
});
