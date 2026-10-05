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

  describe('DT-42: disciplinas a cargo del delegado', () => {
    const disciplinas = [
      { id: 1, nombre: 'Fútbol Mayor' },
      { id: 4, nombre: 'Natación' },
    ];
    const delegado = {
      id: 7,
      dni: '30111222',
      email: 'delegado@socialclub.local',
      nombre: 'Diego',
      apellido: 'Delegado',
      activo: true,
      creadoEn: '2026-01-15T10:00:00.000Z',
      roles: [{ rol: { id: 3, nombre: 'DELEGADO' } }],
      disciplinas: [{ id: 4, nombre: 'Natación' }],
    };

    it('ofrece el rol DELEGADO y solo entonces muestra las disciplinas', async () => {
      const user = userEvent.setup();
      render(<UsuarioForm modo="crear" onSubmit={vi.fn()} disciplinas={disciplinas} />);

      expect(screen.queryByText(/disciplinas a cargo/i)).not.toBeInTheDocument();
      await user.click(screen.getByRole('checkbox', { name: /delegado/i }));

      expect(screen.getByText(/disciplinas a cargo/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Fútbol Mayor' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Natación' })).not.toBeChecked();
    });

    it('exige al menos una disciplina para un delegado', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={{ ...delegado, disciplinas: [] }}
          onSubmit={onSubmit}
          mostrarPasswordField={false}
          disciplinas={disciplinas}
        />,
      );

      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      expect(
        await screen.findByText('Seleccioná al menos una disciplina a cargo del delegado'),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('precarga las disciplinas del delegado y envía las elegidas', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={delegado}
          onSubmit={onSubmit}
          mostrarPasswordField={false}
          disciplinas={disciplinas}
        />,
      );

      expect(screen.getByRole('checkbox', { name: 'Natación' })).toBeChecked();
      await user.click(screen.getByRole('checkbox', { name: 'Fútbol Mayor' }));
      await user.click(screen.getByRole('checkbox', { name: 'Natación' }));
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['DELEGADO'], disciplinasIds: ['1'] }),
        expect.anything(),
      );
    });
  });
});

