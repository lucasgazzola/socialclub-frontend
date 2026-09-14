import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EventosPage } from './EventosPage';
import { useEventos } from '../hooks/useEventos';

vi.mock('../hooks/useEventos', () => ({
  useEventos: vi.fn(),
}));

describe('EventosPage', () => {
  it('muestra un botón para comprar entradas y lo conecta con la ruta del evento', () => {
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

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Comprar entradas' });
    expect(link).toHaveAttribute('href', '/eventos/12/entradas');
  });
});
