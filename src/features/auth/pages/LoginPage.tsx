import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si ya hay sesión, redirige al destino original (o al inicio).
  const destino = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
  if (usuario) {
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">SocialClub</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresá con tu cuenta administrativa</p>
        </div>
        <LoginForm onSuccess={() => navigate(destino, { replace: true })} />
      </Card>
    </div>
  );
}
