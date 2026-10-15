import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalHabilitacionExcepcional } from './ModalHabilitacionExcepcional';
import { useHabilitarExcepcional } from '../hooks/useDocumentacion';

vi.mock('../hooks/useDocumentacion', () => ({
  useHabilitarExcepcional: vi.fn(),
}));

const mockMutateAsync = vi.fn();

describe('US-28 · ModalHabilitacionExcepcional', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    inscripcionId: 10,
    personaId: 1,
    participanteNombre: 'Pérez, Juan',
    disciplinaNombre: 'Fútbol',
    categoriaNombre: 'Primera',
    motivos: ['Certificado médico: vencido el 30/09/2026'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useHabilitarExcepcional as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('US-28 · Criterio 1 y 2: renderiza los datos del participante, motivos de bloqueo y campos requeridos', () => {
    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    expect(screen.getByText('Habilitación excepcional de participación')).toBeInTheDocument();
    expect(screen.getByText(/Pérez, Juan/)).toBeInTheDocument();
    expect(screen.getByText(/Fútbol · Primera/)).toBeInTheDocument();
    expect(screen.getByText('Certificado médico: vencido el 30/09/2026')).toBeInTheDocument();

    expect(screen.getByLabelText(/Motivo de la excepción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cantidad de días de habilitación/i)).toBeInTheDocument();
  });

  it('US-28 · Criterio 1: obliga a ingresar un motivo escrito antes de confirmar el levantamiento', async () => {
    const user = userEvent.setup();
    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar habilitación/i });
    await user.click(botonConfirmar);

    expect(
      screen.getByText('El motivo escrito es obligatorio para habilitar excepcionalmente la participación.'),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('US-28 · Criterio 1: exige que el motivo tenga al menos 5 caracteres', async () => {
    const user = userEvent.setup();
    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    const textarea = screen.getByLabelText(/Motivo de la excepción/i);
    await user.type(textarea, 'abc');

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar habilitación/i });
    await user.click(botonConfirmar);

    expect(screen.getByText('El motivo debe tener al menos 5 caracteres.')).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('US-28 · Criterio 2: rechaza si la cantidad de días es menor a 1', async () => {
    const user = userEvent.setup();
    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    const textarea = screen.getByLabelText(/Motivo de la excepción/i);
    await user.type(textarea, 'Excepción médica justificada por el profesional');

    const inputDias = screen.getByLabelText(/Cantidad de días de habilitación/i);
    await user.clear(inputDias);
    await user.type(inputDias, '0');

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar habilitación/i });
    await user.click(botonConfirmar);

    expect(
      screen.getByText('La cantidad de días debe ser un número entero mayor o igual a 1.'),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('US-28: envía el formulario exitosamente y cierra el modal', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({ id: 99 });

    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    const textarea = screen.getByLabelText(/Motivo de la excepción/i);
    await user.type(textarea, 'Turno médico reprogramado para fin de mes en clínica privada');

    const inputDias = screen.getByLabelText(/Cantidad de días de habilitación/i);
    await user.clear(inputDias);
    await user.type(inputDias, '20');

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar habilitación/i });
    await user.click(botonConfirmar);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        inscripcionId: 10,
        payload: {
          motivo: 'Turno médico reprogramado para fin de mes en clínica privada',
          dias: 20,
        },
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('US-28: el botón Cancelar cierra el modal sin enviar', async () => {
    const user = userEvent.setup();
    render(<ModalHabilitacionExcepcional {...defaultProps} />);

    const botonCancelar = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(botonCancelar);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});

