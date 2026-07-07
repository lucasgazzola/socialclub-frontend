import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EditarSocioPage } from '@/features/socios/pages/EditarSocioPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { CrearSocioPage } from '@/features/socios/pages/CrearSocioPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { InscripcionPage } from '@/features/inscripcion/pages/InscripcionPage';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './paths';

/**
 * Árbol de rutas de la aplicación.
 *
 * - `/login` es pública.
 * - El resto vive detrás de `ProtectedRoute` (sesión activa) y del `AppLayout`.
 * - Algunas secciones suman una guarda por rol.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Socios: consulta accesible a ADMIN y COLABORADOR */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
          </Route>

<<<<<<< HEAD
          {/* Socios: crear y editar solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="socios/nuevo" element={<CrearSocioPage />} />
=======
          {/* Socios: editar solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="socios/:id/editar" element={<EditarSocioPage />} />
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
          </Route>

          {/* Usuarios: solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>

          {/* Inscripciones: ADMIN y DELEGADO */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'DELEGADO']} />}>
            <Route path="inscripcion" element={<InscripcionPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}