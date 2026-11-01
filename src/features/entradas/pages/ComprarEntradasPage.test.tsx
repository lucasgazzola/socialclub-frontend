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
  useIniciarCompraEntradas: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockIrAPagar = vi.fn();
vi.mock('@/features/pasarela/hooks/usePasarela', () => ({
  irAPagar: (url: string) => mockIrAPagar(url),
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

  it('habilita la compra de un evento publicado sin período de venta (como el backend)', () => {
    mockUseEvento.mockReturnValue({
      data: {
        id: 1,
        nombre: 'Peña sin período de venta',
        precio: 1500,
        entradasDisponibles: 10,
        estado: 'PUBLICADO',
        requiereEntrada: true,
        inicioVenta: null,
        finVenta: null,
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ComprarEntradasPage />);

    expect(screen.queryByText('La venta no está habilitada para este evento.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comprar entradas/i })).toBeEnabled();
  });

  it('permite cambiar cantidad', async () => {
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
  });

  const eventoEnVenta = {
    id: 1,
    nombre: 'Torneo Abierto',
    descripcion: 'Torneo tenis',
    precio: 1000,
    entradasDisponibles: 5,
    estado: 'PUBLICADO',
    inicioVenta: new Date(Date.now() - 3600000).toISOString(),
    finVenta: new Date(Date.now() + 3600000).toISOString(),
  };

  it('TC-263 · TASK-51: confirma el pago, reserva y redirige a la pasarela', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({ data: eventoEnVenta, isLoading: false, isError: false });
    mockMutateAsync.mockResolvedValueOnce({
      referencia: 'ref-1',
      estado: 'PENDIENTE',
      urlPago: 'https://www.mercadopago.com.ar/checkout/ref-1',
    });

    renderWithProviders(<ComprarEntradasPage />);

    fireEvent.change(screen.getByLabelText(/Cantidad/i), { target: { value: '2' } });
    await user.click(screen.getByRole('button', { name: /Comprar entradas/i }));

    // Modal de confirmación con el resumen, sin campos de tarjeta.
    expect(screen.getByText('Confirmar pago')).toBeInTheDocument();
    expect(screen.getByText('2 entrada(s)')).toBeInTheDocument();
    expect(screen.queryByLabelText(/tarjeta/i)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('pagar-ir-a-pasarela'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ eventoId: 1, cantidad: 2 });
    });
    expect(mockIrAPagar).toHaveBeenCalledWith('https://www.mercadopago.com.ar/checkout/ref-1');
  });

  it('TASK-51: si no hay nada que pagar va directo al resultado', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({ data: eventoEnVenta, isLoading: false, isError: false });
    mockMutateAsync.mockResolvedValueOnce({ referencia: 'ref-0', estado: 'APROBADA', urlPago: null });

    renderWithProviders(<ComprarEntradasPage />);

    await user.click(screen.getByRole('button', { name: /Comprar entradas/i }));
    await user.click(screen.getByTestId('pagar-ir-a-pasarela'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pagos/resultado?referencia=ref-0');
    });
    expect(mockIrAPagar).not.toHaveBeenCalled();
  });

  it('notifica error si no se puede iniciar la compra (p. ej. se agotaron)', async () => {
    const user = userEvent.setup();
    mockUseEvento.mockReturnValue({ data: eventoEnVenta, isLoading: false, isError: false });
    mockMutateAsync.mockRejectedValueOnce(
      new Error('Las entradas se agotaron. Actualizá la página e intentá nuevamente.'),
    );

    renderWithProviders(<ComprarEntradasPage />);

    await user.click(screen.getByRole('button', { name: /Comprar entradas/i }));
    await user.click(screen.getByTestId('pagar-ir-a-pasarela'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Las entradas se agotaron. Actualizá la página e intentá nuevamente.',
      );
    });
    expect(mockIrAPagar).not.toHaveBeenCalled();
  });
});
