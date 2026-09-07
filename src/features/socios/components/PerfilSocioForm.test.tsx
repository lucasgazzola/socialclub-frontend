import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerfilSocioForm } from './PerfilSocioForm';
import type { PersonaDeUsuario, UsuarioAutenticado } from '@/features/auth/types';

const mockMutateAsync = vi.fn();

vi.mock('../hooks/useSocios', () => ({
  useUpdatePerfilSocio: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockUsuario: UsuarioAutenticado = {
  id: 1,
  email: 'lucas@club.com',
  nombre: 'Lucas',
  apellido: 'Gazzola',
  roles: ['SOCIO'],
};

const mockPersona: PersonaDeUsuario = {
  id: 10,
  dni: '40123456',
  email: 'lucas@club.com',
  telefono: '351 123 4567',
  categoriaId: 1,
  categoria: { id: 1, nombre: 'Activo' },
  fechaAlta: '2025-01-01',
  activo: true,
};

describe('PerfilSocioForm (US-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el DNI, categoría y estado en modo solo lectura/deshabilitado', () => {
    render(<PerfilSocioForm usuario={mockUsuario} persona={mockPersona} />);

    const dniInput = screen.getByLabelText(/DNI/i);
    expect(dniInput).toHaveValue('40123456');
    expect(dniInput).toBeDisabled();
    expect(dniInput).toHaveAttribute('readonly');

    const categoriaInput = screen.getByLabelText(/Categoría/i);
    expect(categoriaInput).toHaveValue('Activo');
    expect(categoriaInput).toBeDisabled();

    const estadoInput = screen.getByLabelText(/Estado/i);
    expect(estadoInput).toHaveValue('Activo');
    expect(estadoInput).toBeDisabled();
  });

  it('permite modificar Nombre, Apellido, Email y Teléfono, y muestra alerta verde de éxito al guardar', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({
      id: 10,
      nombre: 'Lucas David',
      apellido: 'Gazzola Alvarez',
      email: 'lucas.nuevo@club.com',
      telefono: '351 999 8888',
    });

    render(<PerfilSocioForm usuario={mockUsuario} persona={mockPersona} />);

    const nombreInput = screen.getByLabelText(/Nombre \*/i);
    const apellidoInput = screen.getByLabelText(/Apellido \*/i);
    const emailInput = screen.getByLabelText(/Correo electrónico \*/i);
    const telefonoInput = screen.getByLabelText(/Teléfono/i);

    await user.clear(nombreInput);
    await user.type(nombreInput, 'Lucas David');

    await user.clear(apellidoInput);
    await user.type(apellidoInput, 'Gazzola Alvarez');

    await user.clear(emailInput);
    await user.type(emailInput, 'lucas.nuevo@club.com');

    await user.clear(telefonoInput);
    await user.type(telefonoInput, '351 999 8888');

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        nombre: 'Lucas David',
        apellido: 'Gazzola Alvarez',
        email: 'lucas.nuevo@club.com',
        telefono: '351 999 8888',
      });
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tus datos personales fueron actualizados con éxito.',
    );
  });

  it('valida campos obligatorios y bloquea el envío si Nombre o Email quedan vacíos', async () => {
    const user = userEvent.setup();
    render(<PerfilSocioForm usuario={mockUsuario} persona={mockPersona} />);

    const nombreInput = screen.getByLabelText(/Nombre \*/i);
    const emailInput = screen.getByLabelText(/Correo electrónico \*/i);

    await user.clear(nombreInput);
    await user.clear(emailInput);

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/El email es obligatorio/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('valida sintaxis de email inválida y bloquea el envío', async () => {
    const user = userEvent.setup();
    render(<PerfilSocioForm usuario={mockUsuario} persona={mockPersona} />);

    const emailInput = screen.getByLabelText(/Correo electrónico \*/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'correo-invalido');

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/El formato de email no es válido/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('muestra banner rojo con mensaje controlado cuando el servidor rechaza por email duplicado', async () => {
    const user = userEvent.setup();
    const errorConStatus = Object.assign(new Error('El correo electrónico ya se encuentra registrado'), {
      status: 409,
    });
    mockMutateAsync.mockRejectedValueOnce(errorConStatus);

    render(<PerfilSocioForm usuario={mockUsuario} persona={mockPersona} />);

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    await user.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo electrónico ya se encuentra registrado por otro usuario activo.',
    );
  });
});
