import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EditarSocioPage } from '@/features/socios/pages/EditarSocioPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { CrearSocioPage } from '@/features/socios/pages/CrearSocioPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage';
import { InscripcionPage } from '@/features/inscripcion/pages/InscripcionPage';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './paths';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="socios/nuevo" element={<CrearSocioPage />} />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>

          {/* Auditoría: solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="auditoria" element={<AuditoriaPage />} />
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