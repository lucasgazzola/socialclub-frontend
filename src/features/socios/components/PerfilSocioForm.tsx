import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle, Lock, UserX } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { perfilSocioSchema, type PerfilSocioFormData } from '../schemas';
import { useUpdatePerfilSocio } from '../hooks/useSocios';
import { useDarseDeBajaSocio } from '../hooks/useDarseDeBajaSocio';
import { ModalConfirmarBajaSocio } from './ModalConfirmarBajaSocio';
import type { PersonaDeUsuario, UsuarioAutenticado } from '@/features/auth/types';

interface PerfilSocioFormProps {
  usuario: UsuarioAutenticado;
  persona: PersonaDeUsuario | null;
}

export function PerfilSocioForm({ usuario, persona }: PerfilSocioFormProps) {
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);

  const { mutateAsync: updatePerfil, isPending } = useUpdatePerfilSocio();
  const { mutateAsync: darseDeBaja, isPending: isBajaPending } = useDarseDeBajaSocio();

  const membresiaActiva = persona?.membresias?.find((m) => m.activo);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilSocioFormData>({
    resolver: zodResolver(perfilSocioSchema),
    defaultValues: {
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: persona?.email || usuario.email || '',
      telefono: persona?.telefono || '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setMensajeExito(null);
    setMensajeError(null);

    try {
      await updatePerfil(data);
      setMensajeExito('Tus datos personales fueron actualizados con éxito.');
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 409 || err.message?.toLowerCase().includes('correo') || err.message?.toLowerCase().includes('email')) {
        setMensajeError('El correo electrónico ya se encuentra registrado por otro usuario activo.');
      } else {
        setMensajeError(err.message || 'Ocurrió un error al guardar los cambios. Intentá nuevamente.');
      }
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      {/* Alerta de Éxito (Toast / Banner verde) */}
      {mensajeExito && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="font-medium">{mensajeExito}</p>
        </div>
      )}

      {/* Alerta de Error (Banner rojo) */}
      {mensajeError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="font-medium">{mensajeError}</p>
        </div>
      )}

      {/* Sección: Datos Inalterables / Solo Lectura — SOLO si tiene membresía activa */}
      {membresiaActiva && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Información de la membresía (Solo lectura)</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="dni" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Lock size={14} className="text-slate-400" />
                DNI
              </label>
              <Input
                id="dni"
                value={persona?.dni ?? '—'}
                readOnly
                disabled
                className="cursor-not-allowed bg-slate-100 text-slate-500 font-medium"
              />
              <p className="mt-1 text-xs text-slate-400">El DNI es inalterable en el sistema.</p>
            </div>

            <div>
              <label htmlFor="categoria" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Lock size={14} className="text-slate-400" />
                Categoría
              </label>
              <Input
                id="categoria"
                value={membresiaActiva.categoria?.nombre || 'Socio'}
                readOnly
                disabled
                className="cursor-not-allowed bg-slate-100 text-slate-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="estado" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Lock size={14} className="text-slate-400" />
                Estado
              </label>
              <Input
                id="estado"
                value={membresiaActiva.activo ? 'Activo' : 'Inactivo'}
                readOnly
                disabled
                className="cursor-not-allowed bg-slate-100 text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sección: Datos Editables */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Datos Personales y de Contacto</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="nombre"
            label="Nombre *"
            placeholder="Ingresá tu nombre"
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <Input
            id="apellido"
            label="Apellido *"
            placeholder="Ingresá tu apellido"
            error={errors.apellido?.message}
            {...register('apellido')}
          />

          <Input
            id="email"
            label="Correo electrónico *"
            type="email"
            placeholder="usuario@dominio.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="telefono"
            label="Teléfono"
            type="tel"
            placeholder="Ej: +54 351 1234567"
            error={errors.telefono?.message}
            {...register('telefono')}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-b border-slate-200 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando cambios…' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Sección: Darme de baja como socio — SOLO si tiene membresía activa */}
      {membresiaActiva && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
            <UserX size={18} className="text-red-600" />
            <span>Darme de baja como socio</span>
          </div>
          <p className="text-xs text-red-700">
            Si decidís darte de baja, tu estado cambiará a Inactivo y no podrás acceder a los beneficios exclusivos para socios. Tu usuario y tus registros se conservarán en el sistema.
          </p>
          <div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setModalBajaAbierto(true)}
            >
              Solicitar baja como socio
            </Button>
          </div>
        </div>
      )}

      <ModalConfirmarBajaSocio
        open={modalBajaAbierto}
        onClose={() => setModalBajaAbierto(false)}
        onConfirm={async () => {
          await darseDeBaja();
          setModalBajaAbierto(false);
        }}
        isPending={isBajaPending}
      />
    </form>
  );
}
