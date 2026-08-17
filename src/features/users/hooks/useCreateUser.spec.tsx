import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { usuariosApi } from '../api/users.api';
import { useCreateUser } from './useCreateUser';

vi.mock('../api/users.api', () => ({
  usuariosApi: {
    create: vi.fn(),
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

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    dni: '40123456',
    email: 'nuevo.admin@socialclub.local',
    password: 'Admin123!',
    name: 'Nuevo',
    lastName: 'Administrador',
    roles: ['ADMIN'],
    ...overrides,
  };
}

function buildCreatedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 15,
    dni: '40123456',
    email: 'nuevo.admin@socialclub.local',
    name: 'Nuevo',
    lastName: 'Administrador',
    active: true,
    createdAt: '2026-07-21T12:00:00.000Z',
    roles: [{ role: { id: 2, name: 'ADMIN' } }],
    ...overrides,
  };
}

describe('HU1 - Registrar un nuevo usuario administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Criterio: El sistema permite al administrador ingresar datos básicos (nombre, DNI, correo, rol asignado)', () => {
    it('confirma el registro exitoso con un mensaje claro al crear un usuario con todos los datos requeridos', async () => {
      const createdUser = buildCreatedUser();
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdUser);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await result.current.mutateAsync(buildPayload());

      expect(usuariosApi.create).toHaveBeenCalledWith(buildPayload(), expect.anything());
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario creado exitosamente');
      });
    });

    it('envia correctamente los datos básicos al crear un usuario COLLABORATOR', async () => {
      const payload = buildPayload({ roles: ['COLLABORATOR'] });
      const createdUser = buildCreatedUser({
        roles: [{ role: { id: 3, name: 'COLLABORATOR' } }],
      });
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdUser);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await result.current.mutateAsync(payload);

      expect(usuariosApi.create).toHaveBeenCalledWith(payload, expect.anything());
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario creado exitosamente');
      });
    });
  });

  describe('Criterio: El sistema valida que no exista otro registro con el mismo DNI o correo', () => {
    it('muestra mensaje de error cuando el DNI ya existe', async () => {
      const apiError = new Error('Ya existe un usuario con ese DNI');
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(buildPayload())).rejects.toThrow(
        'Ya existe un usuario con ese DNI',
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Ya existe un usuario con ese DNI');
      });
    });

    it('muestra mensaje de error cuando el email ya existe', async () => {
      const apiError = new Error('Ya existe un usuario con ese email');
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(buildPayload())).rejects.toThrow(
        'Ya existe un usuario con ese email',
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Ya existe un usuario con ese email');
      });
    });

    it('muestra mensaje de error genérico cuando la API falla sin mensaje específico', async () => {
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockRejectedValue('Error desconocido');

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(buildPayload())).rejects.toBe('Error desconocido');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al crear el usuario');
      });
    });
  });

  describe('Criterio: El sistema guarda el rol seleccionado y habilita las funcionalidades correspondientes', () => {
    it('guarda el usuario con rol ADMIN y devuelve los datos del usuario creado', async () => {
      const createdUser = buildCreatedUser();
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdUser);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(buildPayload());

      expect(response).toMatchObject({
        id: 15,
        active: true,
        roles: [{ role: { name: 'ADMIN' } }],
      });
    });

    it('guarda el usuario con multiples roles si se seleccionan varios', async () => {
      const payload = buildPayload({ roles: ['ADMIN', 'COLLABORATOR'] });
      const createdUser = buildCreatedUser({
        roles: [
          { role: { id: 2, name: 'ADMIN' } },
          { role: { id: 3, name: 'COLLABORATOR' } },
        ],
      });
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(createdUser);

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(payload);

      expect(usuariosApi.create).toHaveBeenCalledWith(payload, expect.anything());
      expect(response.roles).toHaveLength(2);
      expect(response.roles.map((r) => r.role.name)).toEqual(
        expect.arrayContaining(['ADMIN', 'COLLABORATOR']),
      );
    });
  });

  describe('Criterio: El sistema confirma el registro exitoso con un mensaje claro', () => {
    it('muestra toast.success con el mensaje "Usuario creado exitosamente" tras crear un usuario', async () => {
      (usuariosApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(buildCreatedUser());

      const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

      await result.current.mutateAsync(buildPayload());

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario creado exitosamente');
      });
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });
});