import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { CambiarContrasenaForm } from '../components/CambiarContrasenaForm';

/**
 * US-41: página propia para cambiar la contraseña.
 *
 * Se llega desde el botón "Cambiar contraseña" de Mi Perfil. Es una ruta de
 * cualquier usuario autenticado (sin chequeo de roles), igual que el endpoint
 * `PATCH /auth/cambiar-contrasena`.
 */
export function CambiarContrasenaPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.perfil)}
          className="mb-2 -ml-2 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Volver a Mi Perfil
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cambiar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          Actualizá tu contraseña de acceso. Por seguridad tenés que confirmar la contraseña actual.
        </p>
      </header>

      <Card className="p-6">
        <CambiarContrasenaForm />
      </Card>
    </div>
  );
}