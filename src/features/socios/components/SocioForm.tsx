import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { socioFormSchema, type SocioFormData } from '../schemas';
import { ROUTES } from '@/routes/paths';

interface SocioFormProps {
  defaultValues?: SocioFormData;
  onSubmit: (data: SocioFormData) => Promise<void>;
  submitLabel: string;
}

export function SocioForm({ defaultValues, onSubmit, submitLabel }: SocioFormProps) {
  const navigate = useNavigate();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SocioFormData>({
    resolver: zodResolver(socioFormSchema),
    defaultValues,
  });

  const onFormSubmit = handleSubmit(async (values) => {
    setErrorServidor(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const err = error as Error & { status?: number };
<<<<<<< HEAD
      if (err.status === 409) {
=======
      if (err.status === 409 || err.message?.toLowerCase().includes('dni')) {
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
        setErrorServidor('Ya existe un socio registrado con ese DNI.');
      } else {
        setErrorServidor(err.message ?? 'Ocurrió un error inesperado. Intentá nuevamente.');
      }
    }
  });

  return (
    <form className="space-y-4" onSubmit={onFormSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="nombre"
          label="Nombre"
          placeholder="Ej: Juan"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          id="apellido"
          label="Apellido"
          placeholder="Ej: Pérez"
          error={errors.apellido?.message}
          {...register('apellido')}
        />
        <Input
          id="dni"
          label="DNI"
          placeholder="Ej: 12345678"
          error={errors.dni?.message}
          {...register('dni')}
        />
        <Input
          id="fechaNacimiento"
          label="Fecha de nacimiento"
          type="date"
          error={errors.fechaNacimiento?.message}
          {...register('fechaNacimiento')}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="ejemplo@correo.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="telefono"
          label="Teléfono"
          placeholder="Ej: 351 123 4567"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
      </div>

      {errorServidor && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorServidor}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.socios)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 9d9d3ee (feat[US-13]: editar socio)
