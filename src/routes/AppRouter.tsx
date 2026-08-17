import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { EditMemberPage } from '@/features/members/pages/EditMemberPage';
import { MembersPage } from '@/features/members/pages/MembersPage';
import { CreateMemberPage } from '@/features/members/pages/CreateMemberPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { FeesPage } from '@/features/fees/pages/FeesPage';
import { EventsPage } from '@/features/tickets/pages/EventsPage';
import { BuyTicketsPage } from '@/features/tickets/pages/BuyTicketsPage';
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

          {/* Socios: consulta accesible a ADMIN y COLLABORATOR */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COLLABORATOR']} />}>
            <Route path="members" element={<MembersPage />} />
          </Route>

          {/* Socios: crear y editar solo ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="members/new" element={<CreateMemberPage />} />
            <Route path="members/:id/edit" element={<EditMemberPage />} />
          </Route>

          {/* Usuarios: solo ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="fees" element={<FeesPage />} />
          </Route>

          {/* Eventos y entradas: ADMIN y COLLABORATOR */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COLLABORATOR']} />}>
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId/tickets" element={<BuyTicketsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
