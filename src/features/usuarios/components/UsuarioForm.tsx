import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { usuarioSchema, type UsuarioFormValues } from '../schemas/usuario.schema';

interface UsuarioFormProps {
  onSubmit: (values: UsuarioFormValues) => Promise<void>;
}

export function UsuarioForm({ onSubmit }: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Input
        label="Nombre"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <Input
        label="Apellido"
        error={errors.apellido?.message}
        {...register('apellido')}
      />

      <Input
        type="number"
        label="DNI"
        error={errors.dni?.message}
        {...register('dni')}
      />

      <Input
        type="email"
        label="Email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        type="password"
        label="Contraseña"
        error={errors.password?.message}
        {...register('password')}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Roles
        </legend>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            value="ADMIN"
            {...register('roles')}
          />
          ADMIN
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            value="COLABORADOR"
            {...register('roles')}
          />
          COLABORADOR
        </label>

        {errors.roles && (
          <p className="text-sm text-red-600">
            {errors.roles.message}
          </p>
        )}
      </fieldset>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Guardando...' : 'Crear usuario'}
      </Button>
    </form>
  );
}