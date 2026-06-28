import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';

interface LoginFormProps {
  onSuccess: () => void;
}

/** Formulario de login: validación con zod + react-hook-form. */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(null);
    try {
      await login(values);
      onSuccess();
    } catch (error) {
      setErrorServidor(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {errorServidor && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorServidor}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
