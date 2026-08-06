import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { authApi } from '../api/auth.api';
import { registerSchema, type RegisterFormValues } from '../schemas/register.schema';

interface RegisterFormProps {
  onSuccess: () => void;
}

/**
 * Formulario de registro público (US-38). No inicia sesión: al crear la cuenta
 * el usuario es redirigido al login para ingresar con sus credenciales.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(null);
    try {
      await authApi.register(values);
      onSuccess();
    } catch (error) {
      setErrorServidor(error instanceof Error ? error.message : 'No se pudo crear la cuenta');
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        id="nombre"
        type="text"
        label="Nombre"
        autoComplete="given-name"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <Input
        id="apellido"
        type="text"
        label="Apellido"
        autoComplete="family-name"
        error={errors.apellido?.message}
        {...register('apellido')}
      />
      <Input
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="password"
        type="password"
        label="Contraseña"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {errorServidor && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorServidor}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
