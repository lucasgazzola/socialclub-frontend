import { createContext } from 'react';
import type { LoginPayload, UsuarioAutenticado } from '../types';

export interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Contexto de autenticación. Se mantiene separado del Provider y del hook
 * para respetar la regla de "fast refresh" (un archivo de componente no debe
 * exportar también valores no-componente).
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
