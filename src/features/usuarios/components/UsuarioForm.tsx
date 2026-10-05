import { useForm, type FieldErrors } from 'react-hook-form';

function hasPasswordFieldError(
  errors: FieldErrors<UsuarioCreateFormValues | UsuarioEditFormValues>,
): errors is FieldErrors<UsuarioCreateFormValues> {
  return 'password' in errors;
}
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, ModalActions } from '@/components/ui';
import {
  ROL_DELEGADO,
  usuarioCreateSchema,
  usuarioEditSchema,
  type UsuarioCreateFormValues,
  type UsuarioEditFormValues,
} from '../schemas/usuario.schema';
import type { Usuario } from '../types';

interface UsuarioFormProps {
  modo: 'crear' | 'editar';
  usuarioInicial?: Usuario | null;
  onSubmit: (values: UsuarioCreateFormValues | UsuarioEditFormValues) => Promise<void>;
  /** Cancelar dentro del modal (DT-20). */
  onCancel?: () => void;
  mostrarPasswordField?: boolean;
  /** DT-42: disciplinas activas que se le pueden asignar a un delegado. */
  disciplinas?: { id: number; nombre: string }[];
}

export function UsuarioForm({
  modo,
  usuarioInicial,
  onSubmit,
  mostrarPasswordField = true,
  onCancel,
  disciplinas = [],
}: UsuarioFormProps) {
  const schema = modo === 'crear' ? usuarioCreateSchema : usuarioEditSchema;
  const defaultValues = usuarioInicial
    ? {
        dni: usuarioInicial.dni ?? '',
        nombre: usuarioInicial.nombre ?? '',
        apellido: usuarioInicial.apellido ?? '',
        email: usuarioInicial.email ?? '',
        password: '',
        roles: usuarioInicial.roles.map((rol) => rol.rol.nombre),
        disciplinasIds: (usuarioInicial.disciplinas ?? []).map((d) => String(d.id)),
      }
    : {
        dni: '',
        nombre: '',
        apellido: '',
        email: '',
        roles: ['ADMIN'],
        disciplinasIds: [],
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioCreateFormValues | UsuarioEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const dniRegistration = register('dni', {
    setValueAs: (value) => String(value ?? '').replace(/\D/g, '').slice(0, 8),
  });

  const passwordError = hasPasswordFieldError(errors)
    ? errors.password?.message
    : undefined;

  const rolesError =
    typeof errors.roles?.message === 'string' ? errors.roles.message : undefined;

  const esDelegado = (watch('roles') ?? []).includes(ROL_DELEGADO);
  // Se manejan a mano: con register, un único checkbox devolvería un booleano.
  const disciplinasSeleccionadas = watch('disciplinasIds') ?? [];
  function alternarDisciplina(id: string, marcada: boolean) {
    const resto = disciplinasSeleccionadas.filter((d) => d !== id);
    setValue('disciplinasIds', marcada ? [...resto, id] : resto, {
      shouldValidate: !!errors.disciplinasIds,
    });
  }
  const disciplinasError =
    typeof errors.disciplinasIds?.message === 'string' ? errors.disciplinasIds.message : undefined;

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="nombre"
        label="Nombre"
        error={typeof errors.nombre?.message === 'string' ? errors.nombre.message : undefined}
        {...register('nombre')}
      />

      <Input
        id="apellido"
        label="Apellido"
        error={typeof errors.apellido?.message === 'string' ? errors.apellido.message : undefined}
        {...register('apellido')}
      />

      <Input
        id="dni"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        label="DNI"
        error={typeof errors.dni?.message === 'string' ? errors.dni.message : undefined}
        {...dniRegistration}
      />

      <Input
        id="email"
        type="email"
        label="Email"
        error={typeof errors.email?.message === 'string' ? errors.email.message : undefined}
        {...register('email')}
      />

      {mostrarPasswordField && modo === 'crear' ? (
        <Input
          id="password"
          type="password"
          label="Contraseña"
          error={passwordError}
          {...register('password')}
        />
      ) : mostrarPasswordField && modo === 'editar' ? (
        <Input
          id="password"
          type="password"
          label="Nueva contraseña"
          error={passwordError}
          placeholder="Dejar en blanco para mantener la actual"
          {...register('password')}
        />
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Roles</legend>

        <label className="flex items-center gap-2">
          <input type="checkbox" value="ADMIN" {...register('roles')} />
          ADMIN
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" value="COLABORADOR" {...register('roles')} />
          COLABORADOR
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" value={ROL_DELEGADO} {...register('roles')} />
          DELEGADO
        </label>

        {rolesError && <p className="text-sm text-red-600">{rolesError}</p>}
      </fieldset>

      {esDelegado && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Disciplinas a cargo</legend>
          <p className="text-xs text-slate-500">
            El delegado recibe las alertas de documentación solo de estas disciplinas.
          </p>
          {disciplinas.length === 0 ? (
            <p className="text-sm text-slate-500">No hay disciplinas activas para asignar.</p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {disciplinas.map((disciplina) => (
                <label key={disciplina.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={disciplinasSeleccionadas.includes(String(disciplina.id))}
                    onChange={(e) => alternarDisciplina(String(disciplina.id), e.target.checked)}
                  />
                  {disciplina.nombre}
                </label>
              ))}
            </div>
          )}
          {disciplinasError && <p className="text-sm text-red-600">{disciplinasError}</p>}
        </fieldset>
      )}

      <ModalActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
      </ModalActions>
    </form>
  );
}