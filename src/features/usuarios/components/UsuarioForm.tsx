import { useForm } from 'react-hook-form';
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
        error={errors.nombre?.message as string | undefined}
        {...register('nombre')}
      />

      <Input
        id="apellido"
        label="Apellido"
        error={errors.apellido?.message as string | undefined}
        {...register('apellido')}
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
          <input type="checkbox" value="COLABORADOR" {...register('roles')} />
          COLABORADOR
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