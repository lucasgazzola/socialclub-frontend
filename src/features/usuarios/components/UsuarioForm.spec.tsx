import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsuarioForm } from './UsuarioForm';

describe('UsuarioForm', () => {
  describe('Modo creación', () => {
    it('permite completar los datos básicos y enviar un usuario válido', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(<UsuarioForm modo="crear" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/nombre/i), 'Nuevo');
      await user.type(screen.getByLabelText(/apellido/i), 'Administrador');
      await user.type(screen.getByLabelText(/dni/i), '40123456');
      await user.type(screen.getByLabelText(/email/i), 'nuevo.admin@socialclub.local');
      await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
      await user.click(screen.getByRole('button', { name: /crear usuario/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nuevo',
          apellido: 'Administrador',
          dni: '40123456',
          email: 'nuevo.admin@socialclub.local',
          password: 'Admin123!',
          roles: ['ADMIN'],
        }),
        expect.anything(),
      );
    });

    it('muestra el rol por defecto ADMIN en modo creación', () => {
      render(<UsuarioForm modo="crear" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

      expect(screen.getByRole('checkbox', { name: /admin/i })).toBeChecked();
    });

    it('muestra la contraseña como campo obligatorio en modo creación', () => {
      render(<UsuarioForm modo="crear" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });
  });

  describe('Modo edición', () => {
    const usuarioInicial = {
      id: 1,
      dni: '12345678',
      email: 'admin@socialclub.local',
      nombre: 'Admin',
      apellido: 'Existente',
      activo: true,
      creadoEn: '2026-01-15T10:00:00.000Z',
      roles: [{ rol: { id: 2, nombre: 'ADMIN' } }],
    };

    it('precarga los datos del usuario existente en el formulario', () => {
      render(
        <UsuarioForm modo="editar" usuarioInicial={usuarioInicial} onSubmit={vi.fn().mockResolvedValue(undefined)} />,
      );

      expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existente')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@socialclub.local')).toBeInTheDocument();
    });

    it('no muestra el campo de contraseña cuando mostrarPasswordField es false', () => {
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          mostrarPasswordField={false}
        />,
      );

      expect(screen.queryByLabelText(/nueva contraseña/i)).not.toBeInTheDocument();
    });

    it('muestra el botón "Guardar cambios" en modo edición', () => {
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          mostrarPasswordField={false}
        />,
      );

      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });

    it('permite modificar el nombre y enviar los cambios', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={onSubmit}
          mostrarPasswordField={false}
        />,
      );

      const nombreInput = screen.getByDisplayValue('Admin');
      await user.clear(nombreInput);
      await user.type(nombreInput, 'AdminModificado');

      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'AdminModificado',
        }),
        expect.anything(),
      );
    });

    it('permite cambiar el rol del usuario en edición', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={onSubmit}
          mostrarPasswordField={false}
        />,
      );

      const colaboradorCheckbox = screen.getByRole('checkbox', { name: /colaborador/i });
      await user.click(colaboradorCheckbox);

      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: expect.arrayContaining(['ADMIN', 'COLABORADOR']),
        }),
        expect.anything(),
      );
    });
  });
});