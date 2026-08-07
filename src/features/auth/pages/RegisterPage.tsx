import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión activa no tiene sentido registrarse: al inicio.
  if (usuario) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const onSuccess = () => {
    toast.success('Cuenta creada. Iniciá sesión con tus credenciales.');
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">SocialClub</h1>
          <p className="mt-1 text-sm text-slate-500">Creá tu cuenta</p>
        </div>
        <RegisterForm onSuccess={onSuccess} />
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link to={ROUTES.login} className="font-medium text-brand-700 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
