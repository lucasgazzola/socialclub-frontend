import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { useRegistrarmeSocio } from '@/features/socios/hooks/useRegistrarmeSocio';
import {
  hacermeSocioFormSchema,
  type HacermeSocioFormValues,
} from '@/features/socios/schemas';
import { formatearDni } from '@/lib/utils/dni';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalFieldInput,
  PortalFieldSelect,
  PortalSurface,
  PortalTitleBar,
} from '../components/PortalUI';

export function PortalHacermeSocioPage() {
  const { usuario, refrescar } = useAuth();
  const navigate = useNavigate();
  const { mutateAsync } = useRegistrarmeSocio();
  const { data: categorias, isLoading: cargandoCategorias } = useCategorias();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const tieneMembresia = usuario?.persona?.membresias?.some((m) => m.activo);
  const dniExistente = Boolean(usuario?.persona?.dni && usuario.persona.dni.trim() !== '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HacermeSocioFormValues>({
    resolver: zodResolver(hacermeSocioFormSchema),
    defaultValues: {
      dni: usuario?.persona?.dni ?? '',
    },
  });

  if (tieneMembresia) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }
  if (!usuario) return null;

  const onFormSubmit = handleSubmit(async (values) => {
    setErrorServidor(null);
    try {
      await mutateAsync({
        dni: values.dni.trim(),
        categoriaId: Number(values.categoriaId),
      });
      await authApi.refresh();
      await refrescar();
      toast.success('¡Felicitaciones! Te registraste como socio correctamente.');
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorServidor(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.',
      );
    }
  });

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Hacerme socio"
        summary="Asociate en segundos para acceder a descuentos en eventos, disciplinas y carnet digital."
      />

      <PortalSurface className="max-w-2xl p-5 sm:p-6">
        <form className="space-y-5" onSubmit={onFormSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PortalFieldInput
              id="nombre"
              label="Nombre"
              value={usuario.nombre ?? ''}
              readOnly
              aria-readonly="true"
            />
            <PortalFieldInput
              id="apellido"
              label="Apellido"
              value={usuario.apellido ?? ''}
              readOnly
              aria-readonly="true"
            />
            <div className="sm:col-span-2">
              <PortalFieldInput
                id="email"
                label="Email"
                type="email"
                value={usuario.email}
                readOnly
                aria-readonly="true"
              />
            </div>

            {dniExistente ? (
              <PortalFieldInput
                id="dni-readonly"
                label="DNI"
                value={formatearDni(usuario.persona?.dni)}
                readOnly
                disabled
              />
            ) : (
              <PortalFieldInput
                id="dni"
                label="DNI"
                placeholder="Ej: 12345678"
                error={errors.dni?.message}
                {...register('dni')}
              />
            )}

            <PortalFieldSelect
              id="categoriaId"
              label="Categoría de socio *"
              disabled={cargandoCategorias}
              error={errors.categoriaId?.message}
              options={[
                {
                  value: '',
                  label: cargandoCategorias ? 'Cargando categorías…' : 'Seleccioná una categoría',
                },
                ...(categorias?.map((c) => ({ value: c.id, label: c.nombre })) ?? []),
              ]}
              {...register('categoriaId')}
            />
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Al confirmar se vincula tu perfil de socio y se habilitan tus beneficios inmediatos en
            SocialClub.
          </p>

          {errorServidor && (
            <div
              role="alert"
              className="rounded-[2px] border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200"
            >
              {errorServidor}
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-slate-300/[0.08] pt-5">
            <PortalButton type="submit" variant="primary" disabled={isSubmitting}>
              <UserPlus size={15} />
              {isSubmitting ? 'Registrando…' : 'Hacerme socio'}
            </PortalButton>
          </div>
        </form>
      </PortalSurface>
    </div>
  );
}
