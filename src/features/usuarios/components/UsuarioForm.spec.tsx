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
      await user.type(screen.getByLabelText('Email'), 'nuevo.admin@socialclub.local');
      await user.type(screen.getByLabelText('Repetí el email'), 'nuevo.admin@socialclub.local');
      await user.click(screen.getByRole('button', { name: /crear usuario/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nuevo',
          apellido: 'Administrador',
          dni: '40123456',
          email: 'nuevo.admin@socialclub.local',
          confirmarEmail: 'nuevo.admin@socialclub.local',
          roles: ['ADMIN'],
        }),
        expect.anything(),
      );
    });

    it('muestra el rol por defecto ADMIN en modo creación', () => {
      render(<UsuarioForm modo="crear" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

      expect(screen.getByRole('checkbox', { name: /admin/i })).toBeChecked();
    });

    it('DT-54: no pide contraseña y avisa que la persona la elige desde el email', () => {
      render(<UsuarioForm modo="crear" onSubmit={vi.fn().mockResolvedValue(undefined)} />);

      expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
      expect(screen.getByText(/enlace para que elija su contraseña/i)).toBeInTheDocument();
    });

    it('DT-54: no deja crear el usuario si los dos emails no coinciden', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UsuarioForm modo="crear" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/nombre/i), 'Nuevo');
      await user.type(screen.getByLabelText(/apellido/i), 'Administrador');
      await user.type(screen.getByLabelText(/dni/i), '40123456');
      await user.type(screen.getByLabelText('Email'), 'nuevo.admin@socialclub.local');
      await user.type(screen.getByLabelText('Repetí el email'), 'nuevo.admin@socialclub.lcoal');
      await user.click(screen.getByRole('button', { name: /crear usuario/i }));

      expect(await screen.findByText('Los emails no coinciden')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
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

    it('DT-54: no muestra contraseña ni pide repetir el email si no cambia', () => {
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
        />,
      );

      expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Repetí el email')).not.toBeInTheDocument();
    });

    it('DT-54: al cambiar el email pide escribirlo dos veces', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UsuarioForm modo="editar" usuarioInicial={usuarioInicial} onSubmit={onSubmit} />);

      await user.clear(screen.getByLabelText('Email'));
      await user.type(screen.getByLabelText('Email'), 'nuevo@socialclub.local');
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

      expect(await screen.findByText('Confirmá el email')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();

      await user.type(screen.getByLabelText('Repetí el email'), 'nuevo@socialclub.local');
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }));
      expect(onSubmit).toHaveBeenCalled();
    });

    it('muestra el botón "Guardar cambios" en modo edición', () => {
      render(
        <UsuarioForm
          modo="editar"
          usuarioInicial={usuarioInicial}
          onSubmit={vi.fn().mockResolvedValue(undefined)}
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
      email: 'diego.navarro@socialclub.local',
      nombre: 'Diego',
      apellido: 'Navarro',
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

  describe('DT-46: Manejo y visualización de errores del servidor', () => {
    it('muestra el error asignado al campo apellido cuando la API lo rechaza', async () => {
      render(
        <UsuarioForm
          modo="crear"
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          errorServidor="El apellido contiene caracteres inválidos"
        />,
      );

      expect(await screen.findByText('El apellido contiene caracteres inválidos')).toBeInTheDocument();
    });

    it('muestra el error asignado al campo DNI cuando ya existe', async () => {
      render(
        <UsuarioForm
          modo="crear"
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          errorServidor="Ya existe un usuario con ese DNI"
        />,
      );

      expect(await screen.findByText('Ya existe un usuario con ese DNI')).toBeInTheDocument();
    });

    it('muestra el error asignado al campo email cuando ya existe', async () => {
      render(
        <UsuarioForm
          modo="crear"
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          errorServidor="Ya existe un usuario con ese email"
        />,
      );

      expect(await screen.findByText('Ya existe un usuario con ese email')).toBeInTheDocument();
    });

    it('muestra un banner general de alerta cuando el error no corresponde a un campo específico', async () => {
      render(
        <UsuarioForm
          modo="crear"
          onSubmit={vi.fn().mockResolvedValue(undefined)}
          errorServidor="Error interno de conexión con el servidor"
        />,
      );

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Error interno de conexión con el servidor');
    });
  });
});
