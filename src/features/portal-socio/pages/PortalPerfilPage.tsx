import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, KeyRound, Lock, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import { ModalConfirmarBajaSocio } from '@/features/socios/components/ModalConfirmarBajaSocio';
import { useDarseDeBajaSocio } from '@/features/socios/hooks/useDarseDeBajaSocio';
import { useReactivarmeSocio } from '@/features/socios/hooks/useReactivarmeSocio';
import { useUpdatePerfilSocio } from '@/features/socios/hooks/useSocios';
import { perfilSocioSchema, type PerfilSocioFormData } from '@/features/socios/schemas';
import { formatearDni } from '@/lib/utils/dni';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalInput,
  PortalPageHeader,
  PortalPanel,
  PortalSelect,
  PortalStatusPill,
} from '../components/PortalUI';

export function PortalPerfilPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);

  const { mutateAsync: updatePerfil, isPending } = useUpdatePerfilSocio();
  const { mutateAsync: darseDeBaja, isPending: isBajaPending } = useDarseDeBajaSocio();
  const { mutateAsync: reactivarme, isPending: isReactivando } = useReactivarmeSocio();

  const persona = usuario?.persona ?? null;
  const membresiaActiva = persona?.membresias?.find((m) => m.activo);
  const esExSocio =
    !membresiaActiva && Boolean(persona?.membresias && persona.membresias.length > 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilSocioFormData>({
    resolver: zodResolver(perfilSocioSchema),
    defaultValues: {
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
      email: persona?.email || usuario?.email || '',
      telefono: persona?.telefono || '',
    },
  });

  if (!usuario) return null;

  const onSubmit = handleSubmit(async (data) => {
    setMensajeExito(null);
    setMensajeError(null);
    try {
      await updatePerfil(data);
      setMensajeExito('Tus datos personales fueron actualizados con éxito.');
    } catch (error) {
      const err = error as Error & { status?: number };
      if (
        err.status === 409 ||
        err.message?.toLowerCase().includes('correo') ||
        err.message?.toLowerCase().includes('email')
      ) {
        setMensajeError(
          'El correo electrónico ya se encuentra registrado por otro usuario activo.',
        );
      } else {
        setMensajeError(
          err.message || 'Ocurrió un error al guardar los cambios. Intentá nuevamente.',
        );
      }
    }
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Editar mis datos"
        subtitle="Mantené actualizados tu información personal y tus datos de contacto en SocialClub."
        actions={
          <PortalButton
            variant="secondary"
            size="sm"
            onClick={() => navigate(ROUTES.cambiarContrasena)}
          >
            <KeyRound size={14} />
            Cambiar contraseña
          </PortalButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <PortalPanel className="p-6">
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              {mensajeExito && (
                <div
                  role="status"
                  className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3.5 text-sm text-emerald-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {mensajeError && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-sm text-rose-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{mensajeError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PortalInput
                  id="nombre"
                  label="Nombre *"
                  placeholder="Ingresá tu nombre"
                  error={errors.nombre?.message}
                  {...register('nombre')}
                />
                <PortalInput
                  id="apellido"
                  label="Apellido *"
                  placeholder="Ingresá tu apellido"
                  error={errors.apellido?.message}
                  {...register('apellido')}
                />
                <PortalInput
                  id="email"
                  type="email"
                  label="Correo electrónico *"
                  placeholder="usuario@dominio.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <PortalInput
                  id="telefono"
                  type="tel"
                  label="Teléfono"
                  placeholder="Ej: +54 351 1234567"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
                <PortalInput
                  id="fechaNacimiento"
                  type="date"
                  label="Fecha de nacimiento"
                  value={persona?.fechaNacimiento?.slice(0, 10) ?? ''}
                  readOnly
                  disabled
                  hint="La fecha de nacimiento no se puede modificar."
                />
                <PortalSelect
                  id="genero"
                  label="Género"
                  value={persona?.genero ?? ''}
                  disabled
                  hint="El género no se puede modificar."
                  options={[
                    { value: '', label: 'Sin especificar' },
                    ...(persona?.genero
                      ? [{ value: persona.genero, label: GENERO_PERSONA_LABELS[persona.genero] }]
                      : []),
                  ]}
                />
              </div>

              <div className="flex items-center gap-3 border-t border-white/[0.07] pt-5">
                <PortalButton type="submit" variant="primary" disabled={isPending}>
                  {isPending ? 'Guardando cambios…' : 'Guardar cambios'}
                </PortalButton>
              </div>
            </form>
          </PortalPanel>
        </div>

        {/* Columna derecha: estado de membresía y baja/reactivación */}
        <div className="space-y-4 lg:col-span-4">
          {membresiaActiva && (
            <PortalPanel className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Membresía</h2>
                <PortalStatusPill tone="active" dot>
                  Activo
                </PortalStatusPill>
              </div>

              <dl className="space-y-3 border-t border-white/[0.07] pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-zinc-400">
                    <Lock size={13} /> DNI
                  </dt>
                  <dd className="font-mono text-zinc-100 tabular-nums">
                    {formatearDni(persona?.dni)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-zinc-400">Categoría</dt>
                  <dd className="font-medium text-zinc-100">
                    {membresiaActiva.categoria?.nombre || 'Socio'}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                  <UserX size={14} />
                  <span>Darme de baja</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Tu usuario y tus registros se conservarán, pero dejarás de acceder a los beneficios
                  de socio activo.
                </p>
                <PortalButton
                  variant="danger"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setModalBajaAbierto(true)}
                >
                  Solicitar baja como socio
                </PortalButton>
              </div>
            </PortalPanel>
          )}

          {esExSocio && (
            <PortalPanel className="space-y-3 border-emerald-400/20 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Ex-socio</h2>
                <PortalStatusPill tone="pending">Inactivo</PortalStatusPill>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Podés reactivar tu membresía en cualquier momento para recuperar el acceso completo
                al club.
              </p>
              <PortalButton
                variant="primary"
                size="sm"
                className="w-full"
                disabled={isReactivando}
                onClick={async () => {
                  try {
                    await reactivarme();
                  } catch {
                    // Notificado por sonner en el hook
                  }
                }}
              >
                <UserCheck size={14} />
                {isReactivando ? 'Reactivando…' : 'Reactivar mi membresía'}
              </PortalButton>
            </PortalPanel>
          )}

          <PortalPanel className="space-y-2.5 p-5">
            <h2 className="text-sm font-semibold text-white">Seguridad de la cuenta</h2>
            <p className="text-xs leading-relaxed text-zinc-400">
              Actualizá tu contraseña de acceso confirmando la actual.
            </p>
            <PortalButton
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigate(ROUTES.cambiarContrasena)}
            >
              Cambiar contraseña
            </PortalButton>
          </PortalPanel>
        </div>
      </div>

      <ModalConfirmarBajaSocio
        open={modalBajaAbierto}
        onClose={() => setModalBajaAbierto(false)}
        onConfirm={async () => {
          await darseDeBaja();
          setModalBajaAbierto(false);
        }}
        isPending={isBajaPending}
      />
    </div>
  );
}
