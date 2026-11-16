import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PerfilSocioForm } from '../components/PerfilSocioForm';
import { ROUTES } from '@/routes/paths';

/**
 * US-11: Editar datos personales.
 * US-41: Cambio de contraseña del usuario autenticado: desde acá se navega a su
 * propia página (`/perfil/cambiar-contrasena`), no se embebe el formulario.
 * Accesible para cualquier usuario autenticado (todos tienen persona).
 * Si tiene membresía activa muestra info de socio read-only.
 */
export function PerfilSocioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mantené actualizados tus datos personales y de contacto en el sistema de SocialClub.
        </p>
      </header>

      <Card className="p-6 shadow-sm">
        <PerfilSocioForm usuario={usuario} persona={usuario.persona ?? null} />
      </Card>

      <Card className="p-6 shadow-sm">
        <h2 className="text-base font-semibold leading-none tracking-tight text-slate-900">
          Seguridad de la cuenta
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Cambiá tu contraseña de acceso. Por seguridad vas a tener que confirmar la contraseña
          actual.
        </p>
        <div className="mt-5">
          <Button type="button" onClick={() => navigate(ROUTES.cambiarContrasena)}>
            Cambiar contraseña
          </Button>
        </div>
      </Card>
    </div>
  );
}
