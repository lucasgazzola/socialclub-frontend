import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES, rutaNuevaDe } from './paths';

/**
 * TASK-60: las rutas anteriores a la separación landing / Mi club / panel
 * (p. ej. `/socios` o `/mis-entradas`) llevan a su lugar nuevo, conservando
 * la query. Cualquier otra ruta desconocida vuelve a la landing.
 */
export function RedirigirRutaVieja() {
  const { pathname, search } = useLocation();
  const nueva = rutaNuevaDe(pathname);
  return <Navigate to={nueva ? `${nueva}${search}` : ROUTES.inicio} replace />;
}
