import { Navigate, Route, Routes } from 'react-router-dom';
import { RedirigirAEdicion } from './RedirigirAEdicion';
import { RedirigirRutaVieja } from './RedirigirRutaVieja';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { VerificarEmailPage } from '@/features/auth/pages/VerificarEmailPage';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { AsociarmePage } from '@/features/socios/pages/AsociarmePage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { DashboardGestionPage } from '@/features/dashboard/pages/DashboardGestionPage';
import { SociosPage } from '@/features/socios/pages/SociosPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { CuotasPage } from '@/features/cuotas/pages/CuotasPage';
import { CuotasHubPage } from '@/features/cuotas/pages/CuotasHubPage';
import { CuotaSocialPage } from '@/features/cuota-social/pages/CuotaSocialPage';
import { ValidarAccesoPage } from '@/features/entradas/pages/ValidarAccesoPage';
import { EventosPage } from '@/features/eventos/pages/EventosPage';
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage';
import { TareasPage } from '@/features/tareas/pages/TareasPage';
import { ProtectedRoute } from './ProtectedRoute';
import { ParticipantesPage } from '@/features/inscripcion/pages/ParticipantesPage';
import { SolicitudesInscripcionPage } from '@/features/inscripcion/pages/SolicitudesInscripcionPage';
import { NotificacionesPage } from '@/features/documentacion/pages/NotificacionesPage';
import { SolicitarReservaPage } from '@/features/reservas/pages/SolicitarReservaPage';
import { SolicitudesReservaPage } from '@/features/reservas/pages/SolicitudesReservaPage';
import { RegistrarPagoDeportivoPage } from '@/features/pagos/pages/RegistrarPagoDeportivoPage';
import { HistorialDeportivoPage } from '@/features/pagos/pages/HistorialDeportivoPage';
import { MorososCuotaSocialPage } from '@/features/pagos/pages/MorososCuotaSocialPage';
import { MorososCuotaDeportivaPage } from '@/features/pagos/pages/MorososCuotaDeportivaPage';
import { EstadoFinancieroPage } from '@/features/reportes/pages/EstadoFinancieroPage';
import { ReporteAsistenciaPage } from '@/features/reportes/pages/ReporteAsistenciaPage';
import { DisciplinasPage } from '@/features/disciplinas/pages/DisciplinasPage';
import { CategoriasDisciplinaPage } from '@/features/disciplinas/pages/CategoriasDisciplinaPage';
import { EspaciosPage } from '@/features/espacios/pages/EspaciosPage';
import { PortalSocioLayout } from '@/components/layout/PortalSocioLayout';
import { PortalInicioPage } from '@/features/portal-socio/pages/PortalInicioPage';
import { PortalEntradasPage } from '@/features/portal-socio/pages/PortalEntradasPage';
import { PortalEventosPage } from '@/features/portal-socio/pages/PortalEventosPage';
import { PortalComprarEntradasPage } from '@/features/portal-socio/pages/PortalComprarEntradasPage';
import { PortalCuotasPage } from '@/features/portal-socio/pages/PortalCuotasPage';
import { PortalInscripcionPage } from '@/features/portal-socio/pages/PortalInscripcionPage';
import { PortalDocumentacionPage } from '@/features/portal-socio/pages/PortalDocumentacionPage';
import { PortalReservasPage } from '@/features/portal-socio/pages/PortalReservasPage';
import { PortalPerfilPage } from '@/features/portal-socio/pages/PortalPerfilPage';
import { PortalCambiarContrasenaPage } from '@/features/portal-socio/pages/PortalCambiarContrasenaPage';
import { PortalResultadoPagoPage } from '@/features/portal-socio/pages/PortalResultadoPagoPage';
import { PortalSimuladorPagoPage } from '@/features/portal-socio/pages/PortalSimuladorPagoPage';
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

      {/* ── Mi club: portal de socios y participantes (diseño de Luis Colque) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PortalSocioLayout />}>
          <Route path="mi-club">
            <Route index element={<PortalInicioPage />} />
            <Route path="entradas" element={<PortalEntradasPage />} />
            <Route path="eventos" element={<PortalEventosPage />} />
            <Route path="eventos/:eventoId/entradas" element={<PortalComprarEntradasPage />} />
            <Route path="cuotas" element={<PortalCuotasPage />} />
            <Route path="disciplinas">
              <Route index element={<Navigate to={ROUTES.solicitarInscripcion} replace />} />
              <Route path="solicitar" element={<PortalInscripcionPage />} />
              <Route path="solicitudes" element={<PortalInscripcionPage />} />
              <Route path="documentacion" element={<PortalDocumentacionPage />} />
            </Route>
            <Route path="reservas" element={<PortalReservasPage />} />
            <Route path="reservas/solicitar" element={<SolicitarReservaPage />} />
            <Route path="perfil" element={<PortalPerfilPage />} />
            <Route path="perfil/cambiar-contrasena" element={<PortalCambiarContrasenaPage />} />
          </Route>
          {/* La API arma estas rutas en los links de la pasarela: no se mueven. */}
          <Route path={ROUTES.resultadoPago} element={<PortalResultadoPagoPage />} />
          <Route path={ROUTES.simuladorPago} element={<PortalSimuladorPagoPage />} />
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
            {/* US-66: bandeja de evaluación de solicitudes de inscripción a disciplinas. */}
            <Route path="inscripcion/solicitudes" element={<SolicitudesInscripcionPage />} />
            <Route path="notificaciones" element={<NotificacionesPage />} />
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
