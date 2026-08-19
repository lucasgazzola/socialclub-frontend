import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { z } from 'zod';
import { RegisterForm } from './RegisterForm';

/**
 * (TC-074/TC-075):
 *   - email: formato inválido -> "Ingresá un email válido"
 *   - password: mínimo 8 caracteres, con mayúscula, minúscula, número y
 *     carácter especial
 *   - nombre/apellido: obligatorios
 */
vi.mock('../schemas/register.schema', () => {
  const registerSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().min(1, 'El email es obligatorio').email('Ingresá un email válido'),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial',
      ),
  });
  return { registerSchema };
});

vi.mock('../api/auth.api', () => ({
  authApi: { register: vi.fn() },
}));

// Mock liviano de los componentes de UI, igual que en SocioForm.test.tsx.
vi.mock('@/components/ui', () => ({
  Input: ({
    id,
    label,
    error,
    ...props
  }: { id: string; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) => (
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

import { authApi } from '../api/auth.api';
import type { UsuarioAutenticado } from '../types';

const datosValidos = {
  nombre: 'Ana',
  apellido: 'Pérez',
  email: 'ana@test.com',
  password: 'Nuevo123!',
};

const usuarioAutenticadoMock: UsuarioAutenticado = {
  id: 1,
  email: datosValidos.email,
  nombre: datosValidos.nombre,
  apellido: datosValidos.apellido,
  roles: [],
};

async function completarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof datosValidos> = {},
) {
  const datos = { ...datosValidos, ...overrides };
  await user.type(screen.getByLabelText('Nombre'), datos.nombre);
  await user.type(screen.getByLabelText('Apellido'), datos.apellido);
  await user.type(screen.getByLabelText('Email'), datos.email);
  await user.type(screen.getByLabelText('Contraseña'), datos.password);
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.mocked(authApi.register).mockReset();
  });

  describe('TC-070: registrarse con datos válidos', () => {
    it('llama a authApi.register con los datos ingresados y ejecuta onSuccess', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      vi.mocked(authApi.register).mockResolvedValue(usuarioAutenticadoMock);

      render(<RegisterForm onSuccess={onSuccess} />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1));
      expect(authApi.register).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Ana',
          apellido: 'Pérez',
          email: 'ana@test.com',
          password: 'Nuevo123!',
        }),
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('muestra "Creando cuenta…" y deshabilita el botón mientras se envía', async () => {
      const user = userEvent.setup();
      let resolverRegister: (() => void) | undefined;
      vi.mocked(authApi.register).mockImplementation(
        () =>
          new Promise<UsuarioAutenticado>((resolve) => {
            resolverRegister = () => resolve(usuarioAutenticadoMock);
          }),
      );

      render(<RegisterForm onSuccess={vi.fn()} />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(await screen.findByRole('button', { name: 'Creando cuenta…' })).toBeDisabled();

      resolverRegister?.();
    });
  });

  describe('TC-073: rechazo por email ya existente', () => {
    it('muestra el error del servidor devuelto por authApi.register y no llama a onSuccess', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      vi.mocked(authApi.register).mockRejectedValue(
        new Error('Ya existe un usuario registrado con ese email'),
      );

      render(<RegisterForm onSuccess={onSuccess} />);

      await completarFormulario(user);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(
        await screen.findByText('Ya existe un usuario registrado con ese email'),
      ).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('TC-074: validar contraseña débil', () => {
    it('rechaza una contraseña que no cumple la política y no envía la solicitud', async () => {
      const user = userEvent.setup();

      render(<RegisterForm onSuccess={vi.fn()} />);

      await completarFormulario(user, { password: 'hola' });
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(
        await screen.findByText(
          'La contraseña debe tener mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial',
        ),
      ).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  describe('TC-075: validar formato de email', () => {
    it('rechaza un email inválido con "Ingresá un email válido" y no envía la solicitud', async () => {
      const user = userEvent.setup();

      render(<RegisterForm onSuccess={vi.fn()} />);

      await completarFormulario(user, { email: 'ana@' });
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(await screen.findByText('Ingresá un email válido')).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  describe('TC-076: validar campos obligatorios (nombre y apellido)', () => {
    it('indica que el nombre es obligatorio cuando se deja vacío', async () => {
      const user = userEvent.setup();

      render(<RegisterForm onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText('Apellido'), datosValidos.apellido);
      await user.type(screen.getByLabelText('Email'), datosValidos.email);
      await user.type(screen.getByLabelText('Contraseña'), datosValidos.password);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });

    it('indica que el apellido es obligatorio cuando se deja vacío', async () => {
      const user = userEvent.setup();

      render(<RegisterForm onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText('Nombre'), datosValidos.nombre);
      await user.type(screen.getByLabelText('Email'), datosValidos.email);
      await user.type(screen.getByLabelText('Contraseña'), datosValidos.password);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

      expect(await screen.findByText('El apellido es obligatorio')).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });
});
