import { useForm, type FieldErrors } from 'react-hook-form';

function hasPasswordFieldError(
  errors: FieldErrors<UsuarioCreateFormValues | UsuarioEditFormValues>,
): errors is FieldErrors<UsuarioCreateFormValues> {
  return 'password' in errors;
}
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import {
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
  mostrarPasswordField?: boolean;
}

export function UsuarioForm({
  modo,
  usuarioInicial,
  onSubmit,
  mostrarPasswordField = true,
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
      }
    : {
        dni: '',
        nombre: '',
        apellido: '',
        email: '',
        roles: ['ADMIN'],
      };

  const {
    register,
    handleSubmit,
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

        {rolesError && <p className="text-sm text-red-600">{rolesError}</p>}
      </fieldset>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
      </Button>
    </form>
  );
}