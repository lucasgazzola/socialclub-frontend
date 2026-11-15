import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, KeyRound, Lock, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GENERO_PERSONA_LABELS } from '@/features/auth/types';
import { useDarseDeBajaSocio } from '@/features/socios/hooks/useDarseDeBajaSocio';
import { useReactivarmeSocio } from '@/features/socios/hooks/useReactivarmeSocio';
import { useUpdatePerfilSocio } from '@/features/socios/hooks/useSocios';
import { perfilSocioSchema, type PerfilSocioFormData } from '@/features/socios/schemas';
import { formatearDni } from '@/lib/utils/dni';
import { ROUTES } from '@/routes/paths';
import { PortalBajaSocioModal } from '../components/PortalModals';
import {
  PortalButton,
  PortalFieldInput,
  PortalFieldSelect,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

/**
 * Edición de datos personales + gestión de membresía nativa del Portal de Socios (sin componentes admin).
 */
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
      <PortalTitleBar
        title="Editar mis datos"
        summary="Actualizá tu nombre, email y teléfono de contacto."
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
          <PortalSurface className="p-5 sm:p-6">
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PortalFieldInput
                  id="nombre"
                  label="Nombre *"
                  placeholder="Ingresá tu nombre"
                  error={errors.nombre?.message}
                  {...register('nombre')}
                />
                <PortalFieldInput
                  id="apellido"
                  label="Apellido *"
                  placeholder="Ingresá tu apellido"
                  error={errors.apellido?.message}
                  {...register('apellido')}
                />
                <PortalFieldInput
                  id="email"
                  type="email"
                  label="Correo electrónico *"
                  placeholder="usuario@dominio.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <PortalFieldInput
                  id="telefono"
                  type="tel"
                  label="Teléfono"
                  placeholder="Ej: +54 351 1234567"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
                <PortalFieldInput
                  id="fechaNacimiento"
                  type="date"
                  label="Fecha de nacimiento"
                  value={persona?.fechaNacimiento?.slice(0, 10) ?? ''}
                  readOnly
                  disabled
                  hint="La fecha de nacimiento no se puede modificar."
                />
                <PortalFieldSelect
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

              <div className="flex items-center gap-3 border-t border-slate-300/[0.08] pt-5">
                <PortalButton type="submit" variant="primary" disabled={isPending}>
                  {isPending ? 'Guardando cambios…' : 'Guardar cambios'}
                </PortalButton>
              </div>
            </form>
          </PortalSurface>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {membresiaActiva && (
            <PortalSurface className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Membresía</h2>
                <PortalTag tone="info" dot>
                  Activo
                </PortalTag>
              </div>

              <dl className="space-y-3 border-t border-slate-300/[0.08] pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-slate-400">
                    <Lock size={13} className="text-blue-400" /> DNI
                  </dt>
                  <dd className="font-mono text-white tabular-nums">
                    {formatearDni(persona?.dni)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">Categoría</dt>
                  <dd className="font-medium text-white">
                    {membresiaActiva.categoria?.nombre || 'Socio'}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-slate-300/[0.08] pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                  <UserX size={14} />
                  <span>Darme de baja</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
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
            </PortalSurface>
          )}

          {esExSocio && (
            <PortalSurface className="space-y-3 border-blue-400/25 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Ex-socio</h2>
                <PortalTag tone="pending">Inactivo</PortalTag>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Podés reactivar tu membresía cuando quieras para recuperar el acceso completo y
                beneficios del club.
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
            </PortalSurface>
          )}

          <PortalSurface variant="muted" className="space-y-2.5 p-5">
            <h2 className="text-sm font-semibold text-white">Seguridad de la cuenta</h2>
            <p className="text-xs leading-relaxed text-slate-400">
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
          </PortalSurface>
        </div>
      </div>

      <PortalBajaSocioModal
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
