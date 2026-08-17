import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/api/query-client';
import { authApi } from '../api/auth.api';
import type { LoginPayload, AuthenticatedUser } from '../types';
import { AuthContext } from './auth-context';

/**
 * Mantiene el estado de la sesión del user en el cliente.
 *
 * La sesión real vive en una cookie httpOnly gestionada por el backend; acá
 * solo guardamos los datos del user para la UI. Al montar, intenta
 * rehidratar la sesión llamando a /auth/me.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    authApi
      .me()
      .then((u) => activo && setUser(u))
      .catch(() => activo && setUser(null))
      .finally(() => activo && setLoading(false));
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const u = await authApi.login(payload);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Descarta el estado del servidor cacheado (socios, usuarios, ...) para no
    // filtrar datos de una sesión a la siguiente (US-40).
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
