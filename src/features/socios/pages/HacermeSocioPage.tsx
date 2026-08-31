import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HacermeSocioForm } from '../components/HacermeSocioForm';
import { useRegistrarmeSocio } from '../hooks/useRegistrarmeSocio';

/**
 * US-09: Accesible solo para usuarios autenticados SIN Persona asociada. Nombre,
 * apellido y email se precargan desde la cuenta, se piden DNI y categoria.
 */
export function HacermeSocioPage() {
  const { usuario, refrescar } = useAuth();
  const navigate = useNavigate();
  const { mutateAsync } = useRegistrarmeSocio();

  // Si el usuario ya tiene Persona asociada, no puede duplicar el alta.
  if (usuario?.persona) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (!usuario) {
    return null; // ProtectedRoute ya redirige al login.
  }

  const handleSubmit = async (data: { dni: string; categoriaId: number }) => {
    await mutateAsync(data);
    // Re-firma la cookie del JWT con el rol SOCIO recien asignado y refresca el
    // perfil en el contexto para que la pantalla principal muestre la membresía.
    await authApi.refresh();
    await refrescar();
    toast.success('¡Felicitaciones! Te registraste como socio correctamente.');
    navigate(ROUTES.dashboard, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Hacerme socio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sumate al club y accedé a los beneficios de la membresía.
        </p>
      </header>

      <Card className="p-6">
        <HacermeSocioForm
          defaultValues={{
            nombre: usuario.nombre ?? '',
            apellido: usuario.apellido ?? '',
            email: usuario.email,
          }}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}