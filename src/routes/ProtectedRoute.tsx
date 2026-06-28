import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenLoader } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { RolNombre } from '@/features/auth/types';
import { ROUTES } from './paths';

interface ProtectedRouteProps {
  /** Si se indica, además de estar autenticado el usuario debe tener uno de estos roles. */
  rolesPermitidos?: RolNombre[];
}

/**
 * Guarda de rutas: exige sesión activa y, opcionalmente, un rol (RNF06).
 * Mientras se verifica la sesión muestra un loader para evitar parpadeos.
 */
export function ProtectedRoute({ rolesPermitidos }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <FullScreenLoader label="Verificando sesión…" />;
  }

  if (!usuario) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (rolesPermitidos && !rolesPermitidos.some((rol) => usuario.roles.includes(rol))) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
        No tenés permisos para acceder a esta sección.
      </div>
    );
  }

  return <Outlet />;
}
