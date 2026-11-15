import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RedirigirAEdicion } from './RedirigirAEdicion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { esUsuarioPortalSocio } from '@/features/auth/utils/roles';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { DashboardGestionPage } from '@/features/dashboard/pages/DashboardGestionPage';
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
import { ResultadoPagoPage } from '@/features/pasarela/pages/ResultadoPagoPage';
import { MisReservasPage } from '@/features/reservas/pages/MisReservasPage';
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
import { PortalCuotasPage } from '@/features/portal-socio/pages/PortalCuotasPage';
import { PortalEntradasPage } from '@/features/portal-socio/pages/PortalEntradasPage';
import { PortalReservasPage } from '@/features/portal-socio/pages/PortalReservasPage';
import { PortalInscripcionPage } from '@/features/portal-socio/pages/PortalInscripcionPage';
import { PortalEventosPage } from '@/features/portal-socio/pages/PortalEventosPage';
import { PortalDocumentacionPage } from '@/features/portal-socio/pages/PortalDocumentacionPage';
import { PortalPerfilPage } from '@/features/portal-socio/pages/PortalPerfilPage';
import { PortalHacermeSocioPage } from '@/features/portal-socio/pages/PortalHacermeSocioPage';
import { PortalCambiarContrasenaPage } from '@/features/portal-socio/pages/PortalCambiarContrasenaPage';
import { PortalComprarEntradasPage } from '@/features/portal-socio/pages/PortalComprarEntradasPage';
import { PortalSimuladorPagoPage } from '@/features/portal-socio/pages/PortalSimuladorPagoPage';
import { PortalResultadoPagoPage } from '@/features/portal-socio/pages/PortalResultadoPagoPage';
import { ROUTES } from './paths';

function SocioOStaff({ socio, staff }: { socio: ReactNode; staff: ReactNode }) {
  const { usuario } = useAuth();
  return <>{esUsuarioPortalSocio(usuario) ? socio : staff}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      {/* Catálogo público de eventos (US-53) */}
      <Route element={<AppLayout />}>
        <Route
          path="eventos"
          element={<SocioOStaff socio={<PortalEventosPage />} staff={<EventosPage />} />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardGestionPage />} />

          {/* Cualquier usuario autenticado */}
          <Route
            path={ROUTES.hacermeSocio}
            element={
              <SocioOStaff socio={<PortalHacermeSocioPage />} staff={<HacermeSocioPage />} />
            }
          />
          <Route
            path={ROUTES.perfil}
            element={<SocioOStaff socio={<PortalPerfilPage />} staff={<PerfilSocioPage />} />}
          />
          <Route
            path="mi-perfil"
            element={<SocioOStaff socio={<PortalPerfilPage />} staff={<PerfilSocioPage />} />}
          />
          <Route
            path={ROUTES.cambiarContrasena}
            element={
              <SocioOStaff
                socio={<PortalCambiarContrasenaPage />}
                staff={<CambiarContrasenaPage />}
              />
            }
          />
          <Route
            path={ROUTES.misCuotas}
            element={<SocioOStaff socio={<PortalCuotasPage />} staff={<MisCuotasPage />} />}
          />
          <Route
            path={ROUTES.misEntradas}
            element={<SocioOStaff socio={<PortalEntradasPage />} staff={<MisEntradasPage />} />}
          />
          <Route
            path={ROUTES.misReservas}
            element={<SocioOStaff socio={<PortalReservasPage />} staff={<MisReservasPage />} />}
          />
          <Route
            path={ROUTES.resultadoPago}
            element={
              <SocioOStaff
                socio={<PortalResultadoPagoPage />}
                staff={<ResultadoPagoPage />}
              />
            }
          />
          <Route
            path={ROUTES.simuladorPago}
            element={
              <SocioOStaff
                socio={<PortalSimuladorPagoPage />}
                staff={<SimuladorPagoPage />}
              />
            }
          />
          <Route
            path={ROUTES.miDocumentacion}
            element={
              <SocioOStaff
                socio={<PortalDocumentacionPage />}
                staff={<MiDocumentacionPage />}
              />
            }
          />
          <Route
            path={ROUTES.solicitarInscripcion}
            element={
              <SocioOStaff
                socio={<PortalInscripcionPage />}
                staff={<SolicitarInscripcionPage />}
              />
            }
          />

          <Route element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR']} />}>
            <Route path="socios" element={<SociosPage />} />
            <Route
              path="socios/:id/editar"
              element={<RedirigirAEdicion a={ROUTES.editarSocio} />}
            />
            <Route path="disciplinas" element={<DisciplinasPage />} />
            <Route path="disciplinas/:id/categorias" element={<CategoriasDisciplinaPage />} />
            <Route path="cuotas/social/morosos" element={<MorososCuotaSocialPage />} />
            <Route path="cuotas/deportiva/cobrar" element={<RegistrarPagoDeportivoPage />} />
            <Route path="cuotas/deportiva/historial" element={<HistorialDeportivoPage />} />
            <Route path="cuotas/deportiva/morosos" element={<MorososCuotaDeportivaPage />} />
            <Route path="reportes/estado-financiero" element={<EstadoFinancieroPage />} />
            <Route path="reportes/asistencia-eventos" element={<ReporteAsistenciaPage />} />
            <Route path={ROUTES.solicitudesReserva} element={<SolicitudesReservaPage />} />
            <Route path={ROUTES.espacios} element={<EspaciosPage />} />
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
          </Route>

          {/* Compra de entradas: cualquier usuario autenticado */}
          <Route>
            <Route
              path="eventos/:eventoId/entradas"
              element={
                <SocioOStaff
                  socio={<PortalComprarEntradasPage />}
                  staff={<ComprarEntradasPage />}
                />
              }
            />
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
          <Route
            element={<ProtectedRoute rolesPermitidos={['ADMIN', 'COLABORADOR', 'DELEGADO']} />}
          >
            <Route path="participantes" element={<ParticipantesPage />} />
          </Route>

          {/* Inscripción: ADMIN y DELEGADO (alineado con los guards del backend) */}
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

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
