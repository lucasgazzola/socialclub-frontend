import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventosPage } from './EventosPage';
import { useActualizarEvento, useCrearEvento, useEventos } from '../hooks/useEventos';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('../hooks/useEventos', () => ({
  useEventos: vi.fn(),
  useCrearEvento: vi.fn(),
  useActualizarEvento: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const crearMutateAsync = vi.fn();
const actualizarMutateAsync = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <EventosPage />
    </MemoryRouter>,
  );
}

/** Mock de datos paginados compatibles con EventosPaginados */
const mockPaginado = {
  items: [
    {
      id: 12,
      nombre: 'Noche de música',
      descripcion: 'Cierre de temporada',
      capacidadMaxima: 100,
      entradasDisponibles: 25,
      entradasVendidas: 10,
      precio: '0',
      descuentoSocio: 0,
      requiereEntrada: true,
      estado: 'PUBLICADO',
      fechaEvento: '2026-11-20T20:00:00.000Z',
      inicioVenta: '2026-01-01T00:00:00.000Z',
      finVenta: '2026-12-31T23:59:59.000Z',
      lugarAcreditacion: 'Club',
      imageUrl: 'socialclub-frontend/src/assets/favicon-blanco.png',
      creadoEn: '2026-08-01T00:00:00.000Z',
    },
  ],
  total: 1,
  pagina: 1,
  porPagina: 5,
  totalPaginas: 1,
};

describe('EventosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearMutateAsync.mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as never);

    vi.mocked(useEventos).mockReturnValue({
      data: mockPaginado,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useCrearEvento).mockReturnValue({
      mutateAsync: crearMutateAsync,
      isPending: false,
    } as never);

    vi.mocked(useActualizarEvento).mockReturnValue({
      mutateAsync: actualizarMutateAsync,
      isPending: false,
    } as never);
  });

  it('muestra la acción de comprar entradas y la conecta con la ruta del evento', () => {
    renderPage();

    const link = screen.getByRole('link', { name: /comprar entradas/i });
    expect(link).toHaveAttribute('href', '/eventos/12/entradas');
  });

  it('oculta Nuevo evento para un usuario autenticado sin rol administrativo', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: { roles: [] } } as never);

    renderPage();

    expect(screen.queryByRole('button', { name: /nuevo evento/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /comprar entradas/i })).toBeInTheDocument();
  });

  it('abre el alta de evento en un modal en lugar de navegar (DT-14)', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    const dialogo = await screen.findByRole('dialog', { name: /nuevo evento/i });
    expect(within(dialogo).getByLabelText(/nombre del evento/i)).toBeInTheDocument();
  });

  it('crea el evento y cierra el modal al confirmar (DT-14)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));

    const dialogo = await screen.findByRole('dialog');
    await user.type(within(dialogo).getByLabelText(/nombre del evento/i), 'Torneo de Verano');
    const inputEntradas = within(dialogo).getByLabelText(/entradas disponibles/i);
    await user.clear(inputEntradas);
    await user.type(inputEntradas, '100');
    // DT-40: fecha en dd/mm/aaaa y hora en hh:mm, sin depender del idioma del navegador.
    await user.type(
      within(dialogo).getByLabelText(/fecha de inicio del evento/i, { selector: '#fechaEvento' }),
      '15012027',
    );
    await user.type(within(dialogo).getByLabelText('Hora de inicio del evento'), '1800');
    await user.click(within(dialogo).getByRole('button', { name: /crear evento/i }));

    await waitFor(() => {
      expect(crearMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Torneo de Verano', entradasDisponibles: 100 }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('cierra el modal con Escape sin crear el evento (DT-14)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /nuevo evento/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('permite abrir el modal de detalle del evento con "Ver detalle" sin iniciar compra (US-53)', async () => {
    const user = userEvent.setup();
    renderPage();

    const btnVerDetalle = screen.getByRole('button', { name: /ver detalle de noche de música/i });
    expect(btnVerDetalle).toBeInTheDocument();

    await user.click(btnVerDetalle);

    const dialog = await screen.findByRole('dialog', { name: /noche de música/i });
    expect(within(dialog).getByText(/cierre de temporada/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Gratis')).toBeInTheDocument();
  });

  it('muestra skeletons de carga mientras se obtienen los eventos (US-53)', () => {
    vi.mocked(useEventos).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    renderPage();

    expect(screen.getByTestId('eventos-skeleton')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay eventos disponibles (US-53)', () => {
    vi.mocked(useEventos).mockReturnValue({
      data: { items: [], total: 0, pagina: 1, porPagina: 5, totalPaginas: 1 },
      isLoading: false,
      isError: false,
    } as never);

    renderPage();

    expect(screen.getByTestId('eventos-vacio')).toBeInTheDocument();
    expect(screen.getByText(/no hay eventos disponibles en este momento/i)).toBeInTheDocument();
  });

  it('conecta los filtros de búsqueda y fechas con useEventos (US-53)', async () => {
    const user = userEvent.setup();
    renderPage();

    const inputSearch = screen.getByPlaceholderText(/buscar por nombre o descripción/i);
    await user.type(inputSearch, 'Primavera');

    const inputDesde = screen.getByLabelText(/desde:/i);
    await user.type(inputDesde, '2026-11-01');

    const inputHasta = screen.getByLabelText(/hasta:/i);
    await user.type(inputHasta, '2026-11-30');

    expect(useEventos).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Primavera',
        fechaDesde: '2026-11-01',
        fechaHasta: '2026-11-30',
      }),
    );
  });
});
