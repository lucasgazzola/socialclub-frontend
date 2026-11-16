import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, destinoAlIngresar } from '@/routes/paths';
import { consumirVolverA } from '@/lib/utils/volverA';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm';
import { MarcoAcceso } from '../components/MarcoAcceso';

/** Solo rutas internas: evita redirigir a otro sitio con un `from` armado. */
function rutaInterna(valor: unknown): string | null {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') ? valor : null;
}

export function LoginPage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const desdeVerificacion =
    (location.state as { desdeVerificacion?: unknown } | null)?.desdeVerificacion === true;

  // TASK-60: con sesión, vuelve a la ruta pedida (o a la que dejó el alta de
  // socio); si no hay, la gestión va al panel y el resto a Mi club.
  if (usuario && !desdeVerificacion) {
    const pedida = rutaInterna((location.state as { from?: unknown } | null)?.from);
    const destino = pedida ?? consumirVolverA() ?? destinoAlIngresar(usuario.roles);
    return <Navigate to={destino} replace />;
  }

  return (
    <MarcoAcceso subtitulo="Ingresá a Mi club o al panel de gestión">
      {/* Al ingresar, el contexto actualiza `usuario` y el render de arriba redirige. */}
      <LoginForm
        onSuccess={() => {
          if (desdeVerificacion) {
            navigate(ROUTES.miClub, { replace: true });
          }
        }}
      />
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <Link to={ROUTES.register} className="font-medium text-brand-700 hover:underline">
          Registrate
        </Link>
      </p>
    </MarcoAcceso>
  );
}
