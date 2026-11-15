import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES, destinoAlIngresar } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';
import { RegisterForm } from '../components/RegisterForm';
import { MarcoAcceso } from '../components/MarcoAcceso';

export function RegisterPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión activa no tiene sentido registrarse.
  if (usuario) {
    return <Navigate to={destinoAlIngresar(usuario.roles)} replace />;
  }

  const onSuccess = () => {
    toast.success('Cuenta creada. Te enviamos un email para verificarla antes de iniciar sesión.');
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <MarcoAcceso subtitulo="Creá tu cuenta">
      <RegisterForm onSuccess={onSuccess} />
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link to={ROUTES.login} className="font-medium text-brand-700 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </MarcoAcceso>
  );
}
