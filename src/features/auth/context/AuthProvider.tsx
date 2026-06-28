import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import type { LoginPayload, UsuarioAutenticado } from '../types';
import { AuthContext } from './auth-context';

/**
 * Mantiene el estado de la sesión del usuario en el cliente.
 *
 * La sesión real vive en una cookie httpOnly gestionada por el backend; acá
 * solo guardamos los datos del usuario para la UI. Al montar, intenta
 * rehidratar la sesión llamando a /auth/me.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    authApi
      .me()
      .then((u) => activo && setUsuario(u))
      .catch(() => activo && setUsuario(null))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const u = await authApi.login(payload);
    setUsuario(u);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
