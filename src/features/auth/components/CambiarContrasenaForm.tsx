import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';
import {
  cambiarContrasenaSchema,
  type CambiarContrasenaFormValues,
} from '../schemas/cambiar-contrasena.schema';
import { useCambiarContrasena } from '../hooks/useCambiarContrasena';

/**
 * US-41: Cambiar contraseña.
 * El usuario autenticado cambia su propia contraseña y debe confirmar la actual:
 * si no coincide, el backend responde 401 sin guardar nada, por eso el error del
 * servidor queda visible en el formulario y no solo en el toast.
 * Al cambiarla exitosamente, se cierra la sesión para exigir reautenticación
 * y se redirige a la pantalla de login.
 */
export function CambiarContrasenaForm() {
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { mutateAsync: cambiarContrasena, isPending } = useCambiarContrasena();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CambiarContrasenaFormValues>({
    resolver: zodResolver(cambiarContrasenaSchema),
    defaultValues: {
      passwordActual: '',
      nuevaContrasena: '',
      confirmarNuevaContrasena: '',
    },
  });

  const onSubmit = handleSubmit(async (valores) => {
    setMensajeExito(null);
    setMensajeError(null);

    try {
      await cambiarContrasena(valores);
      reset();
      setMensajeExito('Tu contraseña fue actualizada correctamente. Cerrando sesión…');
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : 'Ocurrió un error al cambiar la contraseña.',
      );
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {mensajeExito && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="font-medium">{mensajeExito}</p>
        </div>
      )}

      {mensajeError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="font-medium">{mensajeError}</p>
        </div>
      )}

      <div className="max-w-sm">
        <Input
          id="passwordActual"
          type="password"
          label="Contraseña actual"
          placeholder="Tu contraseña actual"
          autoComplete="current-password"
          error={errors.passwordActual?.message}
          {...register('passwordActual')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="nuevaContrasena"
          type="password"
          label="Nueva contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={errors.nuevaContrasena?.message}
          {...register('nuevaContrasena')}
        />

        <Input
          id="confirmarNuevaContrasena"
          type="password"
          label="Confirmar nueva contraseña"
          placeholder="Repetí la nueva contraseña"
          autoComplete="new-password"
          error={errors.confirmarNuevaContrasena?.message}
          {...register('confirmarNuevaContrasena')}
        />
      </div>

      <p className="text-xs text-slate-500">
        La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un
        número y un carácter especial.
      </p>

      <div className="pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando contraseña…' : 'Guardar nueva contraseña'}
        </Button>
      </div>
    </form>
  );
}
