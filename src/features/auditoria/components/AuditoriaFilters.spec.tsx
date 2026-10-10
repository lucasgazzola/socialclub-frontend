import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuditoriaFilters } from './AuditoriaFilters';

describe('US-33 · AuditoriaFilters', () => {
  it('renderiza pestañas de período (incluyendo Personalizado), selector de acción y buscador', () => {
    render(
      <AuditoriaFilters
        onFiltrar={vi.fn()}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    expect(screen.getByRole('tab', { name: /todo/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /última 1h/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /últimas 24h/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /últimos 7 días/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /personalizado/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/acción/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por entidad/i)).toBeInTheDocument();

    // El botón manual de filtrar fue removido (filtrado reactivo)
    expect(screen.queryByRole('button', { name: /filtrar$/i })).not.toBeInTheDocument();
  });

  it('llama a onFiltrar inmediatamente al cambiar la pestaña de período', () => {
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /últimas 24h/i }));

    expect(handleFiltrar).toHaveBeenCalledWith(
      expect.objectContaining({
        periodo: '24h',
      }),
    );
  });

  it('llama a onFiltrar inmediatamente al seleccionar una acción', () => {
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/acción/i), { target: { value: 'CREAR' } });

    expect(handleFiltrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'CREAR',
      }),
    );
  });

  it('ejecuta onFiltrar tras el debounce de 300ms al tipear en entidad', async () => {
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/buscar por entidad/i), {
      target: { value: 'Socio' },
    });

    await waitFor(
      () => {
        expect(handleFiltrar).toHaveBeenCalledWith(
          expect.objectContaining({
            entidad: 'Socio',
          }),
        );
      },
      { timeout: 1000 },
    );
  });

  it('al hacer clic en la pestaña Personalizado abre el popover con los campos de fecha', async () => {
    render(
      <AuditoriaFilters
        onFiltrar={vi.fn()}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    const tabPersonalizado = screen.getByRole('tab', { name: /personalizado/i });
    fireEvent.click(tabPersonalizado);

    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('muestra el botón Limpiar cuando hay filtros activos y ejecuta onLimpiar al presionarlo', () => {
    const handleLimpiar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={vi.fn()}
        onLimpiar={handleLimpiar}
        filtrosActivos={{ accion: 'LOGIN', periodo: 'todo' }}
      />,
    );

    const btnLimpiar = screen.getByRole('button', { name: /limpiar/i });
    expect(btnLimpiar).toBeInTheDocument();

    fireEvent.click(btnLimpiar);
    expect(handleLimpiar).toHaveBeenCalled();
  });

  it('muestra error de validación cuando fechaDesde es posterior a fechaHasta en rango personalizado', async () => {
    const user = userEvent.setup();
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{ periodo: 'todo' }}
      />,
    );

    // Activar pestaña Personalizado para abrir popover
    const tabPersonalizado = screen.getByRole('tab', { name: /personalizado/i });
    await user.click(tabPersonalizado);

    const inputDesde = screen.getByLabelText('Desde');
    const inputHasta = screen.getByLabelText('Hasta');

    await user.type(inputDesde, '20052026');
    await user.type(inputHasta, '10052026');

    await waitFor(() => {
      expect(
        screen.getByText('La fecha "Desde" no puede ser posterior a "Hasta"'),
      ).toBeInTheDocument();
    });
  });
});
