import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Usuario } from '../types';
import { UsuariosPage } from './UsuariosPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const state = vi.hoisted(() => ({
  usuarios: [] as Usuario[],
  isLoading: false,
  isError: false,
  error: null as Error | null,
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deactivateMutateAsync: vi.fn(),
  activateMutateAsync: vi.fn(),
}));

vi.mock('../hooks/useUsers', () => ({
  useUsers: () => ({
    data: state.usuarios,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
  }),
}));

vi.mock('../hooks/useCreateUsuario', () => ({
  useCreateUsuario: () => ({ mutateAsync: state.createMutateAsync, isPending: false }),
}));

vi.mock('../hooks/useUpdateUsuario', () => ({
  useUpdateUsuario: () => ({ mutateAsync: state.updateMutateAsync, isPending: false }),
}));

vi.mock('../hooks/useDeactivateUsuario', () => ({
  useDeactivateUsuario: () => ({ mutateAsync: state.deactivateMutateAsync, isPending: false }),
}));

vi.mock('../hooks/useActivateUsuario', () => ({
  useActivateUsuario: () => ({ mutateAsync: state.activateMutateAsync, isPending: false }),
}));

function buildUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    dni: '12345678',
    email: 'admin@socialclub.local',
    nombre: 'Admin',
    apellido: 'Gestor',
    activo: true,
    creadoEn: '2026-01-15T10:00:00.000Z',
    roles: [{ rol: { id: 2, nombre: 'ADMIN' } }],
    ...overrides,
  };
}

describe('UsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.usuarios = [];
    state.isLoading = false;
    state.isError = false;
    state.error = null;
    state.createMutateAsync.mockResolvedValue(undefined);
    state.updateMutateAsync.mockResolvedValue(undefined);
    state.deactivateMutateAsync.mockResolvedValue(undefined);
    state.activateMutateAsync.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('muestra la lista de usuarios con su estado activo/inactivo (TC-011)', () => {
    state.usuarios = [
      buildUsuario(),
      buildUsuario({
        id: 2,
        nombre: 'Ana',
        apellido: 'Pérez',
        email: 'ana@socialclub.local',
        activo: false,
      }),
    ];

    render(<UsuariosPage />);

    expect(screen.getByText('Admin Gestor')).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('permite crear un usuario válido y cierra el modal al confirmar (TC-006, TC-012)', async () => {
    state.usuarios = [buildUsuario()];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nombre/i), 'Nuevo');
    await user.type(screen.getByLabelText(/apellido/i), 'Administrador');
    await user.type(screen.getByLabelText(/dni/i), '40123456');
    await user.type(screen.getByLabelText(/email/i), 'nuevo.admin@socialclub.local');
    await user.type(screen.getByLabelText(/contraseña/i), 'Admin123!');
    await user.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(state.createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nuevo',
          apellido: 'Administrador',
          dni: '40123456',
          email: 'nuevo.admin@socialclub.local',
          password: 'Admin123!',
          roles: ['ADMIN'],
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('precarga los datos y permite guardar los cambios de un usuario existente (TC-009)', async () => {
    state.usuarios = [buildUsuario()];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /editar/i }));

    expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gestor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@socialclub.local')).toBeInTheDocument();

    const nombreInput = screen.getByLabelText(/nombre/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'AdminModificado');

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'admin.modificado@socialclub.local');

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(state.updateMutateAsync).toHaveBeenCalledWith({
        id: 1,
        payload: expect.objectContaining({
          nombre: 'AdminModificado',
          email: 'admin.modificado@socialclub.local',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('permite cambiar el rol de un usuario existente al editar (TC-010)', async () => {
    state.usuarios = [buildUsuario()];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /editar/i }));

    await user.click(screen.getByRole('checkbox', { name: /colaborador/i }));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(state.updateMutateAsync).toHaveBeenCalledWith({
        id: 1,
        payload: expect.objectContaining({
          roles: expect.arrayContaining(['ADMIN', 'COLABORADOR']),
        }),
      });
    });
  });

  it('deshabilita un usuario activo tras confirmar la acción (TC-011)', async () => {
    state.usuarios = [buildUsuario()];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /desactivar/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(state.deactivateMutateAsync).toHaveBeenCalledWith(1);
    });
  });

  it('no deshabilita al usuario si el administrador cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    state.usuarios = [buildUsuario()];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /desactivar/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(state.deactivateMutateAsync).not.toHaveBeenCalled();
  });

  it('permite reactivar un usuario inactivo tras confirmar la acción', async () => {
    state.usuarios = [buildUsuario({ activo: false })];
    const user = userEvent.setup();

    render(<UsuariosPage />);

    await user.click(screen.getByRole('button', { name: /activar/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(state.activateMutateAsync).toHaveBeenCalledWith(1);
    });
  });
});