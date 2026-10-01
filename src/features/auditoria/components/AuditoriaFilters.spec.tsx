import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuditoriaFilters } from './AuditoriaFilters';

describe('US-33 · AuditoriaFilters', () => {
  it('renderiza todos los campos de filtrado y el botón filtrar', () => {
    render(
      <AuditoriaFilters
        onFiltrar={vi.fn()}
        onLimpiar={vi.fn()}
        filtrosActivos={{}}
      />,
    );

    expect(screen.getByLabelText(/acción/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por entidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filtrar/i })).toBeInTheDocument();
  });

  it('ejecuta onFiltrar con los valores ingresados al enviar el formulario', async () => {
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{}}
      />,
    );

    fireEvent.change(screen.getByLabelText(/acción/i), { target: { value: 'CREAR' } });
    fireEvent.change(screen.getByPlaceholderText(/buscar por entidad/i), {
      target: { value: 'Socio' },
    });
    fireEvent.change(screen.getByLabelText(/desde/i), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText(/hasta/i), {
      target: { value: '2026-01-31' },
    });

    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }));

    await waitFor(() => {
      expect(handleFiltrar).toHaveBeenCalledWith({
        accion: 'CREAR',
        entidad: 'Socio',
        fechaDesde: '2026-01-01',
        fechaHasta: '2026-01-31',
      });
    });
  });

  it('muestra el botón Limpiar cuando hay filtros activos y ejecuta onLimpiar al presionarlo', () => {
    const handleLimpiar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={vi.fn()}
        onLimpiar={handleLimpiar}
        filtrosActivos={{ accion: 'LOGIN' }}
      />,
    );

    const btnLimpiar = screen.getByRole('button', { name: /limpiar/i });
    expect(btnLimpiar).toBeInTheDocument();

    fireEvent.click(btnLimpiar);
    expect(handleLimpiar).toHaveBeenCalled();
  });

  it('muestra error de validación cuando fechaDesde es posterior a fechaHasta', async () => {
    const handleFiltrar = vi.fn();
    render(
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={vi.fn()}
        filtrosActivos={{}}
      />,
    );

    fireEvent.change(screen.getByLabelText(/desde/i), {
      target: { value: '2026-05-20' },
    });
    fireEvent.change(screen.getByLabelText(/hasta/i), {
      target: { value: '2026-05-10' },
    });

    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('La fecha "Desde" no puede ser posterior a "Hasta"'),
      ).toBeInTheDocument();
    });

    expect(handleFiltrar).not.toHaveBeenCalled();
  });
});
