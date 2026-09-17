import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { HacermeSocioPage } from '@/features/socios/pages/HacermeSocioPage';
import { PerfilSocioPage } from '@/features/socios/pages/PerfilSocioPage';
import { EditarSocioPage } from '@/features/socios/pages/EditarSocioPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { CuotasPage } from '@/features/cuotas/pages/CuotasPage';
import { CuotasHubPage } from '@/features/cuotas/pages/CuotasHubPage';
import { CuotaSocialPage } from '@/features/cuota-social/pages/CuotaSocialPage';
import { EditarCuotaSocialPage } from '@/features/cuota-social/pages/EditarCuotaSocialPage';
import { ComprarEntradasPage } from '@/features/entradas/pages/ComprarEntradasPage';
import { ValidarAccesoPage } from '@/features/entradas/pages/ValidarAccesoPage';
import { EventosPage } from '@/features/eventos/pages/EventosPage';
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage';
import { ProtectedRoute } from './ProtectedRoute';
import { InscripcionPage } from '@/features/inscripcion/pages/InscripcionPage';
import { EditarParticipantePage } from '@/features/inscripcion/pages/EditarParticipantePage';
import { ParticipantesPage } from '@/features/inscripcion/pages/ParticipantesPage';
import { CargarDocumentacionPage } from '@/features/documentacion/pages/CargarDocumentacionPage';
import { MisCuotasPage } from '@/features/pagos/pages/MisCuotasPage';
import { ROUTES } from './paths';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Cualquier usuario autenticado */}
          <Route path={ROUTES.hacermeSocio} element={<HacermeSocioPage />} />
          <Route path={ROUTES.perfil} element={<PerfilSocioPage />} />
          <Route path={ROUTES.misCuotas} element={<MisCuotasPage />} />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="socios/:id/editar" element={<EditarSocioPage />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="cuotas" element={<CuotasHubPage />} />
            <Route path="cuotas/deportiva" element={<CuotasPage />} />
            <Route path="cuotas/social" element={<CuotaSocialPage />} />
            <Route path="cuotas/social/:id/editar" element={<EditarCuotaSocialPage />} />
          </Route>

          {/* Eventos y entradas: ADMIN y COLABORADOR */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="eventos" element={<EventosPage />} />
            <Route path="eventos/:eventoId/entradas" element={<ComprarEntradasPage />} />
            <Route path="eventos/:eventoId/validar" element={<ValidarAccesoPage />} />
            <Route path="entradas/validar" element={<ValidarAccesoPage />} />
          </Route>


          {/* Auditoría: solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>

          {/* Participantes (US-08): búsqueda y filtrado — ADMIN, COLABORADOR y DELEGADO
              (desde US-07 el delegado necesita el listado para dar de baja) */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR', 'DELEGADO']} />}>
            <Route path="participantes" element={<ParticipantesPage />} />
          </Route>

          {/* Inscripción: ADMIN y DELEGADO (alineado con los guards del backend) */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'DELEGADO']} />}>
            <Route path="inscripcion" element={<InscripcionPage />} />
            <Route path="documentacion" element={<CargarDocumentacionPage />} />
            <Route path="participante/:id/editar" element={<EditarParticipantePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
