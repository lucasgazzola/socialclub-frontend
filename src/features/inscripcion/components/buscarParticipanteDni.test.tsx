import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuscarParticipanteDni } from './buscarParticipanteDni';

describe('BuscarParticipanteDni', () => {
  it('permite escribir DNI y buscar con botón o con tecla Enter', async () => {
    const user = userEvent.setup();
    const mockOnBuscar = vi.fn();
    const mockOnRegistrarNuevo = vi.fn();

    render(
      <BuscarParticipanteDni
        cargando={false}
        noEncontrado={false}
        onBuscar={mockOnBuscar}
        onRegistrarNuevo={mockOnRegistrarNuevo}
      />,
    );

    const input = screen.getByLabelText(/Buscar participante por DNI/i);
    const searchBtn = screen.getByRole('button', { name: /Buscar/i });

    expect(searchBtn).toBeDisabled();

    await user.type(input, '12345678');
    expect(searchBtn).not.toBeDisabled();

    await user.click(searchBtn);
    expect(mockOnBuscar).toHaveBeenCalledWith('12345678');

    await user.type(input, '{Enter}');
    expect(mockOnBuscar).toHaveBeenCalledTimes(2);
  });

  it('muestra spinner cuando está cargando y deshabilita botón', () => {
    render(
      <BuscarParticipanteDni
        cargando={true}
        noEncontrado={false}
        onBuscar={vi.fn()}
        onRegistrarNuevo={vi.fn()}
      />,
    );

    const searchBtn = screen.getByRole('button', { name: /Buscar/i });
    expect(searchBtn).toBeDisabled();
    expect(searchBtn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra advertencia cuando no se encuentra el participante', () => {
    render(
      <BuscarParticipanteDni
        cargando={false}
        noEncontrado={true}
        onBuscar={vi.fn()}
        onRegistrarNuevo={vi.fn()}
      />,
    );

    expect(screen.getByText('No hay resultados para ese DNI.')).toBeInTheDocument();
  });

  it('muestra error cuando ocurre un fallo y permite clickear inscribir nuevo', async () => {
    const user = userEvent.setup();
    const mockOnRegistrarNuevo = vi.fn();

    render(
      <BuscarParticipanteDni
        cargando={false}
        noEncontrado={false}
        error="Error de conexión"
        onBuscar={vi.fn()}
        onRegistrarNuevo={mockOnRegistrarNuevo}
      />,
    );

    expect(screen.getByText('Error de conexión')).toBeInTheDocument();

    const inscribirBtn = screen.getByRole('button', {
      name: /Inscribir nuevo participante/i,
    });
    await user.click(inscribirBtn);
    expect(mockOnRegistrarNuevo).toHaveBeenCalled();
  });
});
