import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ComprarEntradasPage } from './ComprarEntradasPage';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ eventoId: '1' }),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseEvento = vi.fn();
vi.mock('@/features/eventos/hooks/useEventos', () => ({
  useEvento: (id: number) => mockUseEvento(id),
}));

const mockMutateAsync = vi.fn();
vi.mock('../hooks/useEntradas', () => ({
  useComprarEntradas: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock MockPasarelaEntradasModal to easily trigger onConfirmPago
vi.mock('../components/MockPasarelaEntradasModal', () => ({
  MockPasarelaEntradasModal: ({ isOpen, onConfirmPago, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-pasarela-modal">
        <button
          onClick={() =>
            onConfirmPago({
              titular: 'Juan Perez',
              numeroTarjeta: '4500000000000000',
              vencimiento: '12/28',
              cvc: '123',
            })
          }
        >
          Confirmar Mock
        </button>
        <button onClick={onClose}>Cancelar Mock</button>
      </div>
    );
  },
}));

vi.mock('../components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

describe('ComprarEntradasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner mientras carga el evento', () => {
    mockUseEvento.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<ComprarEntradasPage />);

    expect(screen.getByText('Cargando evento…')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la carga del evento', () => {
    mockUseEvento.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al obtener evento'),
    });

    renderWithProviders(<ComprarEntradasPage />);

    expect(screen.getByText('Error al obtener evento')).toBeInTheDocument();
  });

  it('muestra datos del evento y deshabilita compra si la venta no está habilitada', () => {
    mockUseEvento.mockReturnValue({
      data: {
        id: 1,
        nombre: 'Fiesta de Fin de Año',
        descripcion: 'Celebración anual del club',
        precio: 5000,
        entradasDisponibles: 10,
        estado: 'BORRADOR',
        inicioVenta: '2026-01-01T00:00:00Z',
        finVenta: '2026-01-10T00:00:00Z',
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ComprarEntradasPage />);

    expect(screen.getAllByText('Fiesta de Fin de Año')).toHaveLength(2);
    expect(screen.getByText('Celebración anual del club')).toBeInTheDocument();
    expect(screen.getByText('La venta no está habilitada para este evento.')).toBeInTheDocument();

    const buyButton = screen.getByRole('button', { name: /Comprar entradas/i });
    expect(buyButton).toBeDisabled();
  });

  it('permite cambiar cantidad y navegar hacia atrás', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({
      data: {
        id: 1,
        nombre: 'Torneo Abierto',
        descripcion: null,
        precio: 1000,
        entradasDisponibles: 5,
        estado: 'PUBLICADO',
        inicioVenta: new Date(Date.now() - 3600000).toISOString(),
        finVenta: new Date(Date.now() + 3600000).toISOString(),
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ComprarEntradasPage />);

    expect(screen.getByText('Sin descripción.')).toBeInTheDocument();

    const cantidadInput = screen.getByLabelText(/Cantidad/i);
    fireEvent.change(cantidadInput, { target: { value: '3' } });

    expect(cantidadInput).toHaveValue(3);

    // Botón volver
    const backBtn = screen.getByRole('button', { name: '' });
    await user.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/eventos');
  });

  it('abre la pasarela y confirma compra con éxito mostrando los QR generados', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({
      data: {
        id: 1,
        nombre: 'Torneo Abierto',
        descripcion: 'Torneo tenis',
        precio: 1000,
        entradasDisponibles: 5,
        estado: 'PUBLICADO',
        inicioVenta: new Date(Date.now() - 3600000).toISOString(),
        finVenta: new Date(Date.now() + 3600000).toISOString(),
      },
      isLoading: false,
      isError: false,
    });

    mockMutateAsync.mockResolvedValueOnce({
      entradas: [
        { id: 101, token: 'token-entrada-1' },
        { id: 102, token: 'token-entrada-2' },
      ],
    });

    renderWithProviders(<ComprarEntradasPage />);

    const buyButton = screen.getByRole('button', { name: /Comprar entradas/i });
    expect(buyButton).not.toBeDisabled();
    await user.click(buyButton);

    expect(screen.getByTestId('mock-pasarela-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar Mock' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          eventoId: 1,
          cantidad: 1,
          titular: 'Juan Perez',
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Compra confirmada. Tus entradas ya están disponibles.',
    );
    expect(screen.getByText('Entradas adquiridas')).toBeInTheDocument();
    expect(screen.getByText('Entrada #1')).toBeInTheDocument();
    expect(screen.getByText('Entrada #2')).toBeInTheDocument();
    expect(screen.getAllByText('token-entrada-1').length).toBeGreaterThan(0);
  });

  it('notifica error si la mutación de compra falla', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({
      data: {
        id: 1,
        nombre: 'Torneo Abierto',
        precio: 1000,
        entradasDisponibles: 5,
        estado: 'PUBLICADO',
        inicioVenta: new Date(Date.now() - 3600000).toISOString(),
        finVenta: new Date(Date.now() + 3600000).toISOString(),
      },
      isLoading: false,
      isError: false,
    });

    mockMutateAsync.mockRejectedValueOnce(new Error('Saldo insuficiente'));

    renderWithProviders(<ComprarEntradasPage />);

    await user.click(screen.getByRole('button', { name: /Comprar entradas/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar Mock' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Saldo insuficiente');
    });
  });
});

