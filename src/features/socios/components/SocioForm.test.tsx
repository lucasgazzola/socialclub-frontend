import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { z } from 'zod';
import { SocioForm } from './SocioForm';

/**
 * Se mockeo `socioFormSchema` con un esquema equivalente:
 *   - nombre, apellido, dni: obligatorios
 *   - email: formato válido, obligatorio
 *   - fechaNacimiento, telefono: opcionales
 */
vi.mock('../schemas', () => {
  const socioFormSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido: z.string().min(1, 'El apellido es obligatorio'),
    dni: z.string().min(1, 'El DNI es obligatorio'),
    fechaNacimiento: z.string().optional(),
    email: z.string().min(1, 'El email es obligatorio').email('El formato de email no es válido'),
    telefono: z.string().optional(),
  });
  return { socioFormSchema };
});

// Mock de los componentes de UI para inputs y mensajes de error sin depender de su implementación interna.
vi.mock('@/components/ui', () => ({
  Input: ({ id, label, error, ...props }: { id: string; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      {error && <p role="alert">{error}</p>}
    </div>
  ),
  Button: ({ children, ...props }: { children?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const datosValidos = {
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '30111222',
  fechaNacimiento: '1990-01-01',
  email: 'juan.perez@example.com',
  telefono: '351 123 4567',
};

async function completarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof datosValidos> = {},
) {
  const datos = { ...datosValidos, ...overrides };

  await user.type(screen.getByLabelText('Nombre'), datos.nombre);
  await user.type(screen.getByLabelText('Apellido'), datos.apellido);
  await user.type(screen.getByLabelText('DNI'), datos.dni);
  if (datos.fechaNacimiento) {
    await user.type(screen.getByLabelText('Fecha de nacimiento'), datos.fechaNacimiento);
  }
  await user.type(screen.getByLabelText('Email'), datos.email);
  if (datos.telefono) {
    await user.type(screen.getByLabelText('Teléfono'), datos.telefono);
  }
}

describe('SocioForm', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  describe('TC-019: registrar un nuevo socio con datos válidos', () => {
    it('llama a onSubmit con los datos ingresados y no muestra errores', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<SocioForm onSubmit={onSubmit} submitLabel="Guardar" />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Juan',
          apellido: 'Pérez',
          dni: '30111222',
          email: 'juan.perez@example.com',
        }),
      );
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('TC-020: DNI duplicado (feedback en el formulario)', () => {
    it('muestra el mensaje de error del servidor y no navega', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockRejectedValue(
        Object.assign(new Error('DNI duplicado'), { status: 409 }),
      );

      render(<SocioForm onSubmit={onSubmit} submitLabel="Guardar" />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(
        await screen.findByText('Ya existe un socio registrado con ese DNI.'),
      ).toBeInTheDocument();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  describe('TC-021: campos obligatorios vacíos', () => {
    it('no permite guardar y muestra error cuando el nombre está vacío', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<SocioForm onSubmit={onSubmit} submitLabel="Guardar" />);

      // Dejamos "Nombre" vacío a propósito y completamos el resto
      await user.type(screen.getByLabelText('Apellido'), datosValidos.apellido);
      await user.type(screen.getByLabelText('DNI'), datosValidos.dni);
      await user.type(screen.getByLabelText('Email'), datosValidos.email);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('TC-022: formato de correo electrónico inválido', () => {
    it('rechaza el email con formato inválido y no llama a onSubmit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<SocioForm onSubmit={onSubmit} submitLabel="Guardar" />);

      await completarFormulario(user, { email: 'socio@invalido' });
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(await screen.findByText('El formato de email no es válido')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('TC-025: confirmación de registro exitoso', () => {
    it('con datos válidos, resuelve onSubmit sin mostrar error de servidor', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<SocioForm onSubmit={onSubmit} submitLabel="Guardar" />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
