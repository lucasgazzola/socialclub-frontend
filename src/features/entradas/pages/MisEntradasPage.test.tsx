import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MisEntradasPage } from './MisEntradasPage';

const mockUseMisEntradas = vi.fn();
vi.mock('../hooks/useEntradas', () => ({
  useMisEntradas: (params?: unknown) => mockUseMisEntradas(params),
}));

vi.mock('../components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrdata'),
  },
}));

const mockSave = vi.fn();
vi.mock('jspdf', () => {
  class MockJsPDF {
    save = mockSave;
    addPage = vi.fn();
    text = vi.fn();
    addImage = vi.fn();
    roundedRect = vi.fn();
    line = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    setLineDashPattern = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
  }
  return {
    jsPDF: MockJsPDF,
  };
});

describe('MisEntradasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner cuando está cargando', () => {
    mockUseMisEntradas.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(<MisEntradasPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la consulta', () => {
    mockUseMisEntradas.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('No se pudieron cargar tus entradas.')).toBeInTheDocument();
  });

  it('muestra estado vacío si el usuario no tiene entradas', () => {
    mockUseMisEntradas.mockReturnValue({
      data: { items: [], total: 0, pagina: 1, porPagina: 10, totalPaginas: 1 },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('Todavía no tenés entradas adquiridas.')).toBeInTheDocument();
  });

  it('renderiza la lista de entradas válidas con badges y permite descargar QR en PNG y en PDF', async () => {
    const user = userEvent.setup();
    const mockData = {
      items: [
        {
          id: 1,
          token: 'token-12345678-abcd',
          estado: 'VALIDA',
          evento: { nombre: 'Torneo Apertura' },
        },
        {
          id: 2,
          token: 'token-87654321-efgh',
          estado: 'VALIDA',
          evento: null,
        },
      ],
      total: 2,
      pagina: 1,
      porPagina: 10,
      totalPaginas: 1,
    };

    mockUseMisEntradas.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    const clickSpy = vi.fn();
    const createElementOriginal = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = createElementOriginal(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('Torneo Apertura')).toBeInTheDocument();
    expect(screen.getByText('Evento')).toBeInTheDocument();
    expect(screen.getAllByText('Válida')).toHaveLength(2);
    expect(screen.getAllByText('token-12345678-abcd').length).toBeGreaterThan(0);

    const downloadQrButtons = screen.getAllByRole('button', { name: /Descargar QR/i });
    expect(downloadQrButtons).toHaveLength(2);
    expect(downloadQrButtons[0]).not.toBeDisabled();

    await user.click(downloadQrButtons[0]);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    const downloadPdfButtons = screen.getAllByRole('button', { name: /Descargar PDF/i });
    expect(downloadPdfButtons).toHaveLength(2);
    expect(downloadPdfButtons[0]).not.toBeDisabled();

    await user.click(downloadPdfButtons[0]);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('entrada-token-12.pdf');
    });
  });

  it('renderiza en gris y deshabilita los botones de descarga para entradas USADA y EXPIRADA (Vencida)', () => {
    const mockData = {
      items: [
        {
          id: 10,
          token: 'token-usada-1111',
          estado: 'USADA',
          evento: { nombre: 'Fiesta de Fin de Año' },
        },
        {
          id: 11,
          token: 'token-expirada-2222',
          estado: 'EXPIRADA',
          evento: { nombre: 'Torneo Pasado' },
        },
      ],
      total: 2,
      pagina: 1,
      porPagina: 10,
      totalPaginas: 1,
    };

    mockUseMisEntradas.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('Usada')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();

    const cardUsada = screen.getByTestId('entrada-card-10');
    expect(cardUsada).toHaveClass('grayscale');

    const cardExpirada = screen.getByTestId('entrada-card-11');
    expect(cardExpirada).toHaveClass('grayscale');

    const btnPdfUsada = screen.getByTestId('btn-descargar-pdf-10');
    const btnQrUsada = screen.getByTestId('btn-descargar-qr-10');
    expect(btnPdfUsada).toBeDisabled();
    expect(btnQrUsada).toBeDisabled();

    const btnPdfExpirada = screen.getByTestId('btn-descargar-pdf-11');
    const btnQrExpirada = screen.getByTestId('btn-descargar-qr-11');
    expect(btnPdfExpirada).toBeDisabled();
    expect(btnQrExpirada).toBeDisabled();
  });

  it('permite buscar entradas por nombre de evento con debounce', async () => {
    const user = userEvent.setup();
    mockUseMisEntradas.mockReturnValue({
      data: { items: [], total: 0, pagina: 1, porPagina: 10, totalPaginas: 1 },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<MisEntradasPage />);

    const searchInput = screen.getByTestId('buscar-entradas-input');
    await user.type(searchInput, 'Pádel');

    await waitFor(() => {
      expect(mockUseMisEntradas).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Pádel' }),
      );
    });
  });

  it('permite cambiar de página y de cantidad por página en TablePagination', async () => {
    const user = userEvent.setup();
    mockUseMisEntradas.mockReturnValue({
      data: {
        items: [
          { id: 1, token: 'tok-1', estado: 'VALIDA', evento: { nombre: 'Torneo 1' } },
        ],
        total: 25,
        pagina: 1,
        porPagina: 10,
        totalPaginas: 3,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });

    renderWithProviders(<MisEntradasPage />);

    const btnSiguiente = screen.getByRole('button', { name: /Siguiente/i });
    await user.click(btnSiguiente);

    await waitFor(() => {
      expect(mockUseMisEntradas).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    const selectorFilas = screen.getByRole('combobox', { name: /Filas por página/i });
    await user.selectOptions(selectorFilas, '20');

    await waitFor(() => {
      expect(mockUseMisEntradas).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 }),
      );
    });
  });
});
