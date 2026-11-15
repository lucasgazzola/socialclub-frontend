import { Navigate, Route, Routes } from 'react-router-dom';
import { RedirigirAEdicion } from './RedirigirAEdicion';
import { RedirigirRutaVieja } from './RedirigirRutaVieja';
import { AppLayout } from '@/components/layout/AppLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { VerificarEmailPage } from '@/features/auth/pages/VerificarEmailPage';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { AsociarmePage } from '@/features/socios/pages/AsociarmePage';
import { MiClubInicioPage } from '@/features/mi-club/pages/MiClubInicioPage';
import { SeccionDisciplinas } from '@/features/mi-club/components/SeccionDisciplinas';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { DashboardGestionPage } from '@/features/dashboard/pages/DashboardGestionPage';
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
import { ResultadoPagoPage } from '@/features/pasarela/pages/ResultadoPagoPage';
import { MisReservasPage } from '@/features/reservas/pages/MisReservasPage';
import { SolicitarReservaPage } from '@/features/reservas/pages/SolicitarReservaPage';
import { SolicitudesReservaPage } from '@/features/reservas/pages/SolicitudesReservaPage';
import { SimuladorPagoPage } from '@/features/pasarela/pages/SimuladorPagoPage';
import { RegistrarPagoDeportivoPage } from '@/features/pagos/pages/RegistrarPagoDeportivoPage';
import { HistorialDeportivoPage } from '@/features/pagos/pages/HistorialDeportivoPage';
import { MorososCuotaSocialPage } from '@/features/pagos/pages/MorososCuotaSocialPage';
import { MorososCuotaDeportivaPage } from '@/features/pagos/pages/MorososCuotaDeportivaPage';
import { EstadoFinancieroPage } from '@/features/reportes/pages/EstadoFinancieroPage';
import { ReporteAsistenciaPage } from '@/features/reportes/pages/ReporteAsistenciaPage';
import { DisciplinasPage } from '@/features/disciplinas/pages/DisciplinasPage';
import { CategoriasDisciplinaPage } from '@/features/disciplinas/pages/CategoriasDisciplinaPage';
import { EspaciosPage } from '@/features/espacios/pages/EspaciosPage';
import { MiDocumentacionPage } from '@/features/documentacion/pages/MiDocumentacionPage';
import { SolicitarInscripcionPage } from '@/features/inscripcion/pages/SolicitarInscripcionPage';
import { ROUTES } from './paths';

/**
 * TASK-60: tres zonas.
 * - Pública: landing (`/`), alta de socio y acceso.
 * - Mi club (`/mi-club`): autogestión personal de cualquier usuario con sesión.
 * - Panel (`/admin`): gestión del club, solo ADMIN, COLABORADOR y DELEGADO.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* ── Públicas ─────────────────────────────────────────────────────── */}
      <Route index element={<LandingPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.verificarEmail} element={<VerificarEmailPage />} />
      <Route path={ROUTES.hacermeSocio} element={<AsociarmePage />} />

      {/* ── Mi club ──────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="mi-club">
            <Route index element={<MiClubInicioPage />} />
            <Route path="entradas" element={<MisEntradasPage />} />
            <Route path="eventos" element={<EventosPage modo="socio" />} />
            <Route path="eventos/:eventoId/entradas" element={<ComprarEntradasPage />} />
            <Route path="cuotas" element={<MisCuotasPage />} />
            <Route path="disciplinas" element={<SeccionDisciplinas />}>
              <Route index element={<Navigate to={ROUTES.misSolicitudesInscripcion} replace />} />
              <Route path="solicitar" element={<SolicitarInscripcionPage />} />
              <Route path="solicitudes" element={<SolicitarInscripcionPage />} />
              <Route path="documentacion" element={<MiDocumentacionPage />} />
            </Route>
            <Route path="reservas" element={<MisReservasPage />} />
            <Route path="reservas/solicitar" element={<SolicitarReservaPage />} />
            <Route path="perfil" element={<PerfilSocioPage />} />
            <Route path="perfil/cambiar-contrasena" element={<CambiarContrasenaPage />} />
          </Route>
          {/* La API arma estas rutas en los links de la pasarela: no se mueven. */}
          <Route path={ROUTES.resultadoPago} element={<ResultadoPagoPage />} />
          <Route path={ROUTES.simuladorPago} element={<SimuladorPagoPage />} />
        </Route>
      </Route>

      {/* ── Panel de gestión ─────────────────────────────────────────────── */}
      <Route path="admin" element={<ProtectedRoute soloGestion />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardGestionPage />} />
          <Route path="eventos" element={<EventosPage modo="gestion" />} />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
            <Route path="socios/:id/editar" element={<RedirigirAEdicion a={ROUTES.editarSocio} />} />
            <Route path="disciplinas" element={<DisciplinasPage />} />
            <Route path="disciplinas/:id/categorias" element={<CategoriasDisciplinaPage />} />
            <Route path="cuotas/social/morosos" element={<MorososCuotaSocialPage />} />
            <Route path="cuotas/deportiva/cobrar" element={<RegistrarPagoDeportivoPage />} />
            <Route path="cuotas/deportiva/historial" element={<HistorialDeportivoPage />} />
            <Route path="cuotas/deportiva/morosos" element={<MorososCuotaDeportivaPage />} />
            <Route path="reportes/estado-financiero" element={<EstadoFinancieroPage />} />
            <Route path="reportes/asistencia-eventos" element={<ReporteAsistenciaPage />} />
            <Route path="reservas/solicitudes" element={<SolicitudesReservaPage />} />
            <Route path="espacios" element={<EspaciosPage />} />
            <Route path="eventos/:eventoId/validar" element={<ValidarAccesoPage />} />
            <Route path="entradas/validar" element={<ValidarAccesoPage />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="cuotas" element={<CuotasHubPage />} />
            <Route path="cuotas/deportiva" element={<CuotasPage />} />
            <Route path="cuotas/social" element={<CuotaSocialPage />} />
            <Route
              path="cuotas/social/:id/editar"
              element={<RedirigirAEdicion a={ROUTES.editarCuotaSocial} />}
            />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="tareas" element={<TareasPage />} />
          </Route>

          {/* Participantes (US-08): ADMIN, COLABORADOR y DELEGADO (US-07: el delegado da de baja). */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR', 'DELEGADO']} />}>
            <Route path="participantes" element={<ParticipantesPage />} />
          </Route>

          {/* Inscripción: ADMIN y DELEGADO (alineado con los guards del backend). */}
          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'DELEGADO']} />}>
            {/* DT-11: inscripción y documentación viven dentro de Participantes. */}
            <Route path="inscripcion" element={<Navigate to={ROUTES.nuevaInscripcion} replace />} />
            <Route path="documentacion" element={<Navigate to={ROUTES.participantes} replace />} />
            <Route
              path="participante/:id/editar"
              element={<RedirigirAEdicion a={ROUTES.editarParticipante} />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<RedirigirRutaVieja />} />
    </Routes>
  );
}
