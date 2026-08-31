import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select } from '@/components/ui';
import { useCategorias } from '../hooks/useCategorias';
import { hacermeSocioFormSchema, type HacermeSocioFormValues } from '../schemas';

interface HacermeSocioFormProps {
  /** Datos del usuario logueado que se precompletan (solo lectura). */
  defaultValues: { nombre: string; apellido: string; email: string };
  onSubmit: (data: { dni: string; categoriaId: number }) => Promise<void>;
  submitLabel?: string;
}

/**
 * US-09 — Formulario "Hacerme socio".
 * Nombre, apellido y email se muestran precargados desde la cuenta del usuario
 * (solo lectura); el usuario ingresa únicamente DNI y categoría de socio.
 */
export function HacermeSocioForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Hacerme socio',
}: HacermeSocioFormProps) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const { data: categorias, isLoading: cargandoCategorias } = useCategorias();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HacermeSocioFormValues>({
    resolver: zodResolver(hacermeSocioFormSchema),
  });

  const onFormSubmit = handleSubmit(async (values) => {
    setErrorServidor(null);
    try {
      await onSubmit({ dni: values.dni.trim(), categoriaId: Number(values.categoriaId) });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.';
      setErrorServidor(mensaje);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onFormSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="nombre"
          label="Nombre"
          value={defaultValues.nombre}
          readOnly
          aria-readonly="true"
        />
        <Input
          id="apellido"
          label="Apellido"
          value={defaultValues.apellido}
          readOnly
          aria-readonly="true"
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={defaultValues.email}
          readOnly
          aria-readonly="true"
          className="sm:col-span-2"
        />

        <Input
          id="dni"
          label="DNI"
          placeholder="Ej: 12345678"
          error={errors.dni?.message}
          {...register('dni')}
        />

        <div className="w-full">
          <label htmlFor="categoriaId" className="mb-1 block text-sm font-medium text-slate-700">
            Categoría de socio
          </label>
          <Select id="categoriaId" disabled={cargandoCategorias} {...register('categoriaId')}>
            <option value="">
              {cargandoCategorias ? 'Cargando categorías…' : 'Seleccioná una categoría'}
            </option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          {errors.categoriaId && (
            <p className="mt-1 text-xs text-red-600">{errors.categoriaId.message}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Al confirmar, se crea tu ficha de socio vinculada a tu cuenta y se te asigna la membresía
        (rol SOCIO). Si ya sos socio o el DNI/email ya están en uso, el sistema te lo informará.
      </p>

      {errorServidor && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorServidor}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}