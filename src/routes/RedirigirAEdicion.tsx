import { Navigate, useParams } from 'react-router-dom';

/**
 * DT-20: las ediciones son modales sobre su listado. Las rutas viejas
 * (/socios/:id/editar, etc.) siguen funcionando y abren ese modal.
 */
export function RedirigirAEdicion({ a }: { a: (id: number) => string }) {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={a(Number(id))} replace />;
}
