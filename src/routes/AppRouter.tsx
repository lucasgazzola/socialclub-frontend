import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EditarSocioPage } from '@/features/socios/pages/EditarSocioPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { CrearSocioPage } from '@/features/socios/pages/CrearSocioPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './paths';

/**
 * Árbol de rutas de la aplicación.
 *
 * - `/login` y `/register` son públicas.
 * - El resto vive detrás de `ProtectedRoute` (sesión activa) y del `AppLayout`.
 * - Algunas secciones suman una guarda por rol.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Socios: consulta accesible a ADMIN y COLABORADOR */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
          </Route>

          {/* Socios: crear y editar solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="socios/nuevo" element={<CrearSocioPage />} />
            <Route path="socios/:id/editar" element={<EditarSocioPage />} />
          </Route>

          {/* Usuarios: solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
