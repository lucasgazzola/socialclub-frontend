import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { usuariosApi } from '../api/users.api';
import { useUpdateUser } from './useUpdateUser';

vi.mock('../api/users.api', () => ({
  usuariosApi: {
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  return function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function buildUpdatedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    dni: '12345678',
    email: 'admin.actualizado@socialclub.local',
    name: 'Admin',
    lastName: 'Actualizado',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-07-21T15:00:00.000Z',
    roles: [{ role: { id: 2, name: 'ADMIN' } }],
    ...overrides,
  };
}

describe('HU2 - Editar usuario administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Criterio: El sistema permite al administrador crear usuarios de gestión con datos básicos y rol asignado', () => {
    it('permite crear un usuario con datos básicos y rol asignado', async () => {
      const payload = {
        id: 1,
        payload: {
          name: 'Nuevo',
          lastName: 'Gestor',
          dni: '40123456',
          email: 'gestor@socialclub.local',
          roles: ['COLLABORATOR'],
        },
      };
      const updatedUser = buildUpdatedUser({
        name: 'Nuevo',
        lastName: 'Gestor',
        dni: '40123456',
        email: 'gestor@socialclub.local',
        roles: [{ role: { id: 3, name: 'COLLABORATOR' } }],
      });
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await result.current.mutateAsync(payload);

      expect(usuariosApi.update).toHaveBeenCalledWith(payload.id, payload.payload);
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario actualizado exitosamente');
      });
    });
  });

  describe('Criterio: El sistema valida que no exista otro usuario con el mismo DNI o correo', () => {
    it('muestra mensaje de error cuando se intenta asignar un DNI que ya pertenece a otro usuario', async () => {
      const apiError = new Error('Ya existe un usuario con ese DNI');
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          id: 1,
          payload: { dni: '99999999' },
        }),
      ).rejects.toThrow('Ya existe un usuario con ese DNI');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Ya existe un usuario con ese DNI');
      });
    });

    it('muestra mensaje de error cuando se intenta asignar un email que ya pertenece a otro usuario', async () => {
      const apiError = new Error('Ya existe un usuario con ese email');
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({
          id: 1,
          payload: { email: 'existente@socialclub.local' },
        }),
      ).rejects.toThrow('Ya existe un usuario con ese email');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Ya existe un usuario con ese email');
      });
    });
  });

  describe('Criterio: El sistema permite editar datos y roles de usuarios de gestión existentes', () => {
    it('permite actualizar solo el nombre y apellido de un usuario', async () => {
      const payload = { id: 1, payload: { name: 'NombreEditado', lastName: 'ApellidoEditado' } };
      const updatedUser = buildUpdatedUser({
        name: 'NombreEditado',
        lastName: 'ApellidoEditado',
      });
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(payload);

      expect(usuariosApi.update).toHaveBeenCalledWith(1, {
        name: 'NombreEditado',
        lastName: 'ApellidoEditado',
      });
      expect(response.name).toBe('NombreEditado');
      expect(response.lastName).toBe('ApellidoEditado');
    });

    it('permite actualizar el email de un usuario', async () => {
      const payload = { id: 1, payload: { email: 'nuevo.email@socialclub.local' } };
      const updatedUser = buildUpdatedUser({ email: 'nuevo.email@socialclub.local' });
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(payload);

      expect(usuariosApi.update).toHaveBeenCalledWith(1, { email: 'nuevo.email@socialclub.local' });
      expect(response.email).toBe('nuevo.email@socialclub.local');
    });

    it('permite actualizar el rol de un usuario', async () => {
      const payload = { id: 1, payload: { roles: ['COLLABORATOR'] } };
      const updatedUser = buildUpdatedUser({
        roles: [{ role: { id: 3, name: 'COLLABORATOR' } }],
      });
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(payload);

      expect(usuariosApi.update).toHaveBeenCalledWith(1, { roles: ['COLLABORATOR'] });
      expect(response.roles).toHaveLength(1);
      expect(response.roles[0].role.name).toBe('COLLABORATOR');
    });

    it('permite actualizar varios campos simultáneamente', async () => {
      const payload = {
        id: 1,
        payload: {
          name: 'Admin',
          lastName: 'Modificado',
          email: 'admin.modificado@socialclub.local',
          roles: ['ADMIN', 'COLLABORATOR'],
        },
      };
      const updatedUser = buildUpdatedUser({
        name: 'Admin',
        lastName: 'Modificado',
        email: 'admin.modificado@socialclub.local',
        roles: [
          { role: { id: 2, name: 'ADMIN' } },
          { role: { id: 3, name: 'COLLABORATOR' } },
        ],
      });
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(payload);

      expect(usuariosApi.update).toHaveBeenCalledWith(1, payload.payload);
      expect(response.name).toBe('Admin');
      expect(response.lastName).toBe('Modificado');
      expect(response.email).toBe('admin.modificado@socialclub.local');
      expect(response.roles).toHaveLength(2);
    });
  });

  describe('Criterio: El sistema confirma cada acción con un mensaje claro', () => {
    it('muestra toast.success con "Usuario actualizado exitosamente" tras editar un usuario', async () => {
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(buildUpdatedUser());

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await result.current.mutateAsync({ id: 1, payload: { name: 'Editado' } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario actualizado exitosamente');
      });
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('muestra el mensaje de error específico cuando la actualización falla', async () => {
      const apiError = new Error('No se pudo actualizar el usuario');
      (usuariosApi.update as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

      await expect(
        result.current.mutateAsync({ id: 1, payload: { name: 'Fallido' } }),
      ).rejects.toThrow('No se pudo actualizar el usuario');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar el usuario');
      });
    });
  });
});