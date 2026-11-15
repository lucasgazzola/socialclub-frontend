import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCambiarContrasena } from '@/features/auth/hooks/useCambiarContrasena';
import {
  cambiarContrasenaSchema,
  type CambiarContrasenaFormValues,
} from '@/features/auth/schemas/cambiar-contrasena.schema';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalFieldInput,
  PortalSurface,
  PortalTitleBar,
} from '../components/PortalUI';

export function PortalCambiarContrasenaPage() {
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
    <div className="space-y-6">
      <PortalTitleBar
        title="Cambiar contraseña"
        summary="Actualizá tu clave confirmando la contraseña actual. Al guardar se cerrará la sesión."
      />

      <PortalSurface className="max-w-xl p-5 sm:p-6">
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {mensajeExito && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-[2px] border border-emerald-400/25 bg-emerald-500/10 p-3.5 text-sm text-emerald-200"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-[2px] border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{mensajeError}</span>
            </div>
          )}

          <PortalFieldInput
            id="passwordActual"
            type="password"
            label="Contraseña actual"
            placeholder="Tu contraseña actual"
            autoComplete="current-password"
            error={errors.passwordActual?.message}
            {...register('passwordActual')}
          />

          <PortalFieldInput
            id="nuevaContrasena"
            type="password"
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            error={errors.nuevaContrasena?.message}
            {...register('nuevaContrasena')}
          />

          <PortalFieldInput
            id="confirmarNuevaContrasena"
            type="password"
            label="Confirmar nueva contraseña"
            placeholder="Repetí la nueva contraseña"
            autoComplete="new-password"
            error={errors.confirmarNuevaContrasena?.message}
            {...register('confirmarNuevaContrasena')}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-300/[0.08] pt-5">
            <PortalButton type="submit" variant="primary" disabled={isPending}>
              <KeyRound size={15} />
              {isPending ? 'Actualizando…' : 'Actualizar contraseña'}
            </PortalButton>
            <PortalButton variant="ghost" onClick={() => navigate(ROUTES.perfil)}>
              Cancelar
            </PortalButton>
          </div>
        </form>
      </PortalSurface>
    </div>
  );
}
