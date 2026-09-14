import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select } from '@/components/ui';
import { cuotaSocialFormSchema, type CuotaSocialFormInput, type CuotaSocialFormValues } from '../schemas';
import type { CategoriaSocio, ConfiguracionCuotaSocial } from '../types';

interface CuotaSocialFormProps {
  modo: 'crear' | 'editar';
  configuracionInicial?: ConfiguracionCuotaSocial | null;
  categorias: CategoriaSocio[];
  onSubmit: (values: CuotaSocialFormValues) => Promise<void>;
}

function proximoPeriodo(): string {
  const ahora = new Date();
  const total = ahora.getFullYear() * 12 + ahora.getMonth() + 2;
  const anio = Math.floor((total - 1) / 12);
  const mes = ((total - 1) % 12) + 1;
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

/**
 * Formulario de cuota social (US16). En edición categoría y período quedan
 * bloqueados porque categoria+período es la clave (solo se edita el monto).
 */
export function CuotaSocialForm({
  modo,
  configuracionInicial,
  categorias,
  onSubmit,
}: CuotaSocialFormProps) {
  const defaultValues = configuracionInicial
    ? {
        categoriaId: configuracionInicial.categoriaId,
        monto: configuracionInicial.monto,
        periodoAplicacion: configuracionInicial.periodoAplicacion,
      }
    : { categoriaId: '', monto: '', periodoAplicacion: '' };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CuotaSocialFormInput, unknown, CuotaSocialFormValues>({
    resolver: zodResolver(cuotaSocialFormSchema),
    defaultValues,
  });

  const esEdicion = modo === 'editar';

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="categoriaId" className="mb-1 block text-sm font-medium text-slate-700">
          Categoría
        </label>
        <Select id="categoriaId" disabled={esEdicion} {...register('categoriaId')}>
          <option value="">Seleccioná una categoría</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Select>
        {errors.categoriaId && (
          <p className="mt-1 text-xs text-red-600">{errors.categoriaId.message}</p>
        )}
      </div>

      <Input
        id="monto"
        type="number"
        min={0.01}
        step="any"
        inputMode="decimal"
        label="Monto mensual ($)"
        placeholder="0.00"
        error={errors.monto?.message as string | undefined}
        {...register('monto')}
      />

      <Input
        id="periodoAplicacion"
        type="month"
        min={proximoPeriodo()}
        label="Período de aplicación"
        disabled={esEdicion}
        error={errors.periodoAplicacion?.message as string | undefined}
        {...register('periodoAplicacion')}
      />

      {modo === 'crear' && (
        <p className="text-xs text-slate-500">
          Si no se indica un período, el monto se aplica desde el período siguiente al actual.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Configurar cuota social'}
      </Button>
    </form>
  );
}
