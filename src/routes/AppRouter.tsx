import { Navigate, Route, Routes } from 'react-router-dom';
import { RedirigirAEdicion } from './RedirigirAEdicion';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { HacermeSocioPage } from '@/features/socios/pages/HacermeSocioPage';
import { PerfilSocioPage } from '@/features/socios/pages/PerfilSocioPage';
import { CambiarContrasenaPage } from '@/features/auth/pages/CambiarContrasenaPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { CuotasPage } from '@/features/cuotas/pages/CuotasPage';
import { CuotasHubPage } from '@/features/cuotas/pages/CuotasHubPage';
import { CuotaSocialPage } from '@/features/cuota-social/pages/CuotaSocialPage';
import { ComprarEntradasPage } from '@/features/entradas/pages/ComprarEntradasPage';
import { MisEntradasPage } from '@/features/entradas/pages/MisEntradasPage';
import { ValidarAccesoPage } from '@/features/entradas/pages/ValidarAccesoPage';
import { EventosPage } from '@/features/eventos/pages/EventosPage';
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage';
import { TareasPage } from '@/features/tareas/pages/TareasPage';
import { ProtectedRoute } from './ProtectedRoute';
import { ParticipantesPage } from '@/features/inscripcion/pages/ParticipantesPage';
import { MisCuotasPage } from '@/features/pagos/pages/MisCuotasPage';
import { RegistrarPagoDeportivoPage } from '@/features/pagos/pages/RegistrarPagoDeportivoPage';
import { HistorialDeportivoPage } from '@/features/pagos/pages/HistorialDeportivoPage';
import { DisciplinasPage } from '@/features/disciplinas/pages/DisciplinasPage';
import { CategoriasDisciplinaPage } from '@/features/disciplinas/pages/CategoriasDisciplinaPage';
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
          <Route path={ROUTES.cambiarContrasena} element={<CambiarContrasenaPage />} />
          <Route path={ROUTES.misCuotas} element={<MisCuotasPage />} />
          <Route path={ROUTES.misEntradas} element={<MisEntradasPage />} />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
            <Route path="socios/:id/editar" element={<RedirigirAEdicion a={ROUTES.editarSocio} />} />
            <Route path="disciplinas" element={<DisciplinasPage />} />
            <Route path="disciplinas/:id/categorias" element={<CategoriasDisciplinaPage />} />
            <Route path="cuotas/deportiva/cobrar" element={<RegistrarPagoDeportivoPage />} />
            <Route path="cuotas/deportiva/historial" element={<HistorialDeportivoPage />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="cuotas" element={<CuotasHubPage />} />
            <Route path="cuotas/deportiva" element={<CuotasPage />} />
            <Route path="cuotas/social" element={<CuotaSocialPage />} />
            <Route path="cuotas/social/:id/editar" element={<RedirigirAEdicion a={ROUTES.editarCuotaSocial} />} />
          </Route>

          {/* Consulta y compra: cualquier usuario autenticado */}
          <Route>
            <Route path="eventos" element={<EventosPage />} />
            <Route path="eventos/:eventoId/entradas" element={<ComprarEntradasPage />} />
          </Route>

          {/* Control operativo: ADMIN y COLABORADOR */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="eventos/:eventoId/validar" element={<ValidarAccesoPage />} />
            <Route path="entradas/validar" element={<ValidarAccesoPage />} />
          </Route>


          {/* Auditoría y tareas automáticas: solo ADMIN */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="tareas" element={<TareasPage />} />
          </Route>

          {/* Participantes (US-08): búsqueda y filtrado — ADMIN, COLABORADOR y DELEGADO
              (desde US-07 el delegado necesita el listado para dar de baja) */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR', 'DELEGADO']} />}>
            <Route path="participantes" element={<ParticipantesPage />} />
          </Route>

          {/* Inscripción: ADMIN y DELEGADO (alineado con los guards del backend) */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'DELEGADO']} />}>
            {/* DT-11: inscripción y documentación viven dentro de Participantes. */}
            <Route path="inscripcion" element={<Navigate to={ROUTES.nuevaInscripcion} replace />} />
            <Route path="documentacion" element={<Navigate to={ROUTES.participantes} replace />} />
            <Route path="participante/:id/editar" element={<RedirigirAEdicion a={ROUTES.editarParticipante} />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
