import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PerfilSocioForm } from '../components/PerfilSocioForm';

/**
 * US-11: Editar datos personales.
 * Accesible para cualquier usuario autenticado (todos tienen persona).
 * Si tiene membresía activa muestra info de socio read-only.
 */
export function PerfilSocioPage() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
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
        <PerfilSocioForm usuario={usuario} persona={usuario.persona ?? null} />
      </Card>
    </div>
  );
}
