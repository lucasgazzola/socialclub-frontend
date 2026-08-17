import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import {
  usuarioCreateSchema,
  usuarioEditSchema,
  type UserCreateFormValues,
  type UserEditFormValues,
} from '../schemas/user.schema';
import type { User } from '../types';

interface UsuarioFormProps {
  modo: 'crear' | 'editar';
  usuarioInicial?: User | null;
  onSubmit: (values: UserCreateFormValues | UserEditFormValues) => Promise<void>;
  mostrarPasswordField?: boolean;
}

export function UserForm({
  modo,
  usuarioInicial,
  onSubmit,
  mostrarPasswordField = true,
}: UsuarioFormProps) {
  const schema = modo === 'crear' ? usuarioCreateSchema : usuarioEditSchema;
  const defaultValues = usuarioInicial
    ? {
        dni: usuarioInicial.dni ?? '',
        name: usuarioInicial.name ?? '',
        lastName: usuarioInicial.lastName ?? '',
        email: usuarioInicial.email ?? '',
        password: '',
        roles: usuarioInicial.roles.map((rol) => rol.role.name),
      }
    : {
        dni: '',
        name: '',
        lastName: '',
        email: '',
        roles: ['ADMIN'],
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const dniRegistration = register('dni', {
    setValueAs: (value) => String(value ?? '').replace(/\D/g, '').slice(0, 8),
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="nombre"
        label="Nombre"
        error={errors.name?.message as string | undefined}
        {...register('name')}
      />

      <Input
        id="apellido"
        label="Apellido"
        error={errors.lastName?.message as string | undefined}
        {...register('lastName')}
      />

      <Input
        id="dni"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        label="DNI"
        error={errors.dni?.message as string | undefined}
        {...dniRegistration}
      />

      <Input
        id="email"
        type="email"
        label="Email"
        error={errors.email?.message as string | undefined}
        {...register('email')}
      />

      {mostrarPasswordField && modo === 'crear' ? (
        <Input
          id="password"
          type="password"
          label="Contraseña"
          error={errors.password?.message as string | undefined}
          {...register('password')}
        />
      ) : mostrarPasswordField && modo === 'editar' ? (
        <Input
          id="password"
          type="password"
          label="Nueva contraseña"
          error={errors.password?.message as string | undefined}
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
          <input type="checkbox" value="COLLABORATOR" {...register('roles')} />
          COLLABORATOR
        </label>

        {errors.roles && (
          <p className="text-sm text-red-600">{errors.roles.message as string}</p>
        )}
      </fieldset>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
      </Button>
    </form>
  );
}