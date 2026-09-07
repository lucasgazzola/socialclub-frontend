import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PerfilSocioForm } from '../components/PerfilSocioForm';

/**
 * US-11: Editar datos personales del socio registrado.
 */
export function PerfilSocioPage() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  // Si el usuario no tiene ficha de socio, no corresponde esta página
  if (!usuario.persona) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mantené actualizados tus datos personales y de contacto en el sistema de SocialClub.
        </p>
      </header>

      <Card className="p-6 shadow-sm">
        <PerfilSocioForm usuario={usuario} persona={usuario.persona} />
      </Card>
    </div>
  );
}
