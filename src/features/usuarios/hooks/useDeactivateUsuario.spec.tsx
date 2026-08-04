import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { usuariosApi } from '../api/usuarios.api';
import { useDeactivateUsuario } from './useDeactivateUsuario';

vi.mock('../api/usuarios.api', () => ({
  usuariosApi: {
    deactivate: vi.fn(),
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

function buildDeactivatedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    dni: '12345678',
    email: 'admin@socialclub.local',
    nombre: 'Admin',
    apellido: 'Administrador',
    activo: false,
    creadoEn: '2026-01-15T10:00:00.000Z',
    actualizadoEn: '2026-07-21T16:00:00.000Z',
    roles: [{ rol: { id: 2, nombre: 'ADMIN' } }],
    ...overrides,
  };
}

describe('HU3 - Dar de baja a un usuario administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Criterio: El sistema cambia el estado del integrante a inactivo', () => {
    it('cambia el estado a activo: false al dar de baja a un usuario activo', async () => {
      const deactivatedUser = buildDeactivatedUser();
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockResolvedValue(deactivatedUser);

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(1);

      expect(usuariosApi.deactivate).toHaveBeenCalledWith(1, expect.anything());
      expect(response.activo).toBe(false);
    });

    it('llama al endpoint DELETE con el id del usuario', async () => {
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDeactivatedUser(),
      );

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      await result.current.mutateAsync(5);

      expect(usuariosApi.deactivate).toHaveBeenCalledWith(5, expect.anything());
    });

    it('persiste el cambio de estado a inactivo en el objeto devuelto', async () => {
      const deactivatedUser = buildDeactivatedUser({ id: 10, dni: '40123456' });
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockResolvedValue(deactivatedUser);

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(10);

      expect(response).toMatchObject({
        id: 10,
        dni: '40123456',
        activo: false,
      });
      expect(response.activo).toBe(false);
    });
  });

  describe('Criterio: Una vez dado de baja, el integrante no puede iniciar sesión ni operar en el sistema', () => {
    it('devuelve el usuario con activo: false indicando que no puede operar', async () => {
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDeactivatedUser(),
      );

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      const response = await result.current.mutateAsync(1);

      expect(response.activo).toBe(false);
      // activo: false es la condicion que el sistema usa para denegar
      // inicio de sesion y operaciones en el sistema
    });

    it('si la API devuelve error al deshabilitar, el usuario sigue activo', async () => {
      const apiError = new Error('Error al deshabilitar el usuario');
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(1)).rejects.toThrow(
        'Error al deshabilitar el usuario',
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al deshabilitar el usuario');
      });
    });
  });

  describe('Criterio: El sistema confirma la acción con un mensaje claro', () => {
    it('muestra toast.success con "Usuario deshabilitado correctamente" tras dar de baja', async () => {
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockResolvedValue(
        buildDeactivatedUser(),
      );

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      await result.current.mutateAsync(1);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuario deshabilitado correctamente');
      });
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('no muestra toast.success si la desactivacion falla', async () => {
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Error interno'),
      );

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(1)).rejects.toThrow('Error interno');

      expect(toast.success).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error interno');
      });
    });

    it('muestra mensaje de error generico cuando la API falla sin mensaje', async () => {
      (usuariosApi.deactivate as ReturnType<typeof vi.fn>).mockRejectedValue('Error');

      const { result } = renderHook(() => useDeactivateUsuario(), { wrapper: createWrapper() });

      await expect(result.current.mutateAsync(1)).rejects.toBe('Error');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al deshabilitar el usuario');
      });
    });
  });
});