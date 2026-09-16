import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventosPage } from './EventosPage';
import { useCrearEvento, useEventos } from '../hooks/useEventos';

vi.mock('../hooks/useEventos', () => ({
  useEventos: vi.fn(),
  useCrearEvento: vi.fn(),
}));

const crearMutateAsync = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <EventosPage />
    </MemoryRouter>,
  );
}

describe('EventosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearMutateAsync.mockResolvedValue(undefined);

    vi.mocked(useEventos).mockReturnValue({
      data: [
        {
          id: 12,
          nombre: 'Noche de música',
          descripcion: 'Cierre de temporada',
          entradasDisponibles: 25,
          entradasVendidas: 10,
          creadoEn: '2026-08-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useCrearEvento).mockReturnValue({
      mutateAsync: crearMutateAsync,
      isPending: false,
    } as never);
  });

  it('muestra un botón para comprar entradas y lo conecta con la ruta del evento', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Comprar entradas' });
    expect(link).toHaveAttribute('href', '/eventos/12/entradas');
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
    await user.type(within(dialogo).getByLabelText(/entradas disponibles/i), '100');
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
});
