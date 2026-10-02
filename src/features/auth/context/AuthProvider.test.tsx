import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { queryClient } from '@/lib/api/query-client';

vi.mock('../api/auth.api', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@/lib/api/query-client', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

describe('AuthProvider & useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rehidrata la sesión exitosamente al montar', async () => {
    const mockUser = {
      id: 1,
      email: 'test@club.com',
      roles: ['SOCIO'],
    };
    vi.mocked(authApi.me).mockResolvedValueOnce(mockUser as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.cargando).toBe(true);

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.usuario).toEqual(mockUser);
  });

  it('establece usuario en null si me() falla al montar', async () => {
    vi.mocked(authApi.me).mockRejectedValueOnce(new Error('No autorizado'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.usuario).toBeNull();
  });

  it('permite iniciar sesión con login()', async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce(null as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));

    const loggedUser = { id: 5, email: 'logged@club.com', roles: ['ADMIN'] };
    vi.mocked(authApi.login).mockResolvedValueOnce(loggedUser as any);
    vi.mocked(authApi.me).mockResolvedValueOnce(loggedUser as any);

    await act(async () => {
      await result.current.login({ email: 'logged@club.com', password: 'secret123' });
    });

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'logged@club.com',
      password: 'secret123',
    });
    expect(result.current.usuario).toEqual(loggedUser);
  });

  it('limpia estado y queryClient con logout()', async () => {
    const mockUser = { id: 1, email: 'test@club.com', roles: ['SOCIO'] };
    vi.mocked(authApi.me).mockResolvedValueOnce(mockUser as any);
    vi.mocked(authApi.logout).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalled();
    expect(result.current.usuario).toBeNull();
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('actualiza el usuario al llamar a refrescar()', async () => {
    vi.mocked(authApi.me).mockResolvedValueOnce({ id: 1, email: 'test@club.com', roles: [] } as any);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));

    const updatedUser = { id: 1, email: 'test@club.com', roles: ['SOCIO'] };
    vi.mocked(authApi.me).mockResolvedValueOnce(updatedUser as any);

    await act(async () => {
      const res = await result.current.refrescar();
      expect(res).toEqual(updatedUser);
    });

    expect(result.current.usuario).toEqual(updatedUser);
  });
});
