import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MisEntradasPage } from './MisEntradasPage';

const mockUseMisEntradas = vi.fn();
vi.mock('../hooks/useEntradas', () => ({
  useMisEntradas: () => mockUseMisEntradas(),
}));

vi.mock('../components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrdata'),
  },
}));

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
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('Todavía no tenés entradas adquiridas.')).toBeInTheDocument();
  });

  it('renderiza la lista de entradas y permite descargar QR', async () => {
    const user = userEvent.setup();
    const mockEntradas = [
      {
        id: 1,
        token: 'token-12345678-abcd',
        evento: { nombre: 'Torneo Apertura' },
      },
      {
        id: 2,
        token: 'token-87654321-efgh',
        evento: null,
      },
    ];

    mockUseMisEntradas.mockReturnValue({
      data: mockEntradas,
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
    expect(screen.getAllByText('token-12345678-abcd').length).toBeGreaterThan(0);

    const downloadButtons = screen.getAllByRole('button', { name: /Descargar QR/i });
    expect(downloadButtons).toHaveLength(2);

    await user.click(downloadButtons[0]);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
