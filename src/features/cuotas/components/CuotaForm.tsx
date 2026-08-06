import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select } from '@/components/ui';
import { cuotaFormSchema, type CuotaFormInput, type CuotaFormValues } from '../schemas';
import type { CategoriaSocio, ConfiguracionCuotaDeportiva, Disciplina } from '../types';

interface CuotaFormProps {
  modo: 'crear' | 'editar';
  configuracionInicial?: ConfiguracionCuotaDeportiva | null;
  disciplinas: Disciplina[];
  categorias: CategoriaSocio[];
  onSubmit: (values: CuotaFormValues) => Promise<void>;
}

/** Próximo mes en formato "YYYY-MM" (los cambios aplican desde el período siguiente). */
function proximoPeriodo(): string {
  const ahora = new Date();
  const total = ahora.getFullYear() * 12 + ahora.getMonth() + 2;
  const anio = Math.floor((total - 1) / 12);
  const mes = ((total - 1) % 12) + 1;
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

/**
 * Formulario de cuota deportiva. En edición los selectores y el período quedan
 * bloqueados porque la combinación disciplina-categoría-período es la clave de
 * la configuración (solo se edita el monto).
 */
export function CuotaForm({
  modo,
  configuracionInicial,
  disciplinas,
  categorias,
  onSubmit,
}: CuotaFormProps) {
  const defaultValues = configuracionInicial
    ? {
        disciplinaId: configuracionInicial.disciplinaId,
        categoriaId: configuracionInicial.categoriaId,
        monto: configuracionInicial.monto,
        periodoAplicacion: configuracionInicial.periodoAplicacion,
      }
    : { disciplinaId: '', categoriaId: '', monto: '', periodoAplicacion: '' };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CuotaFormInput, unknown, CuotaFormValues>({
    resolver: zodResolver(cuotaFormSchema),
    defaultValues,
  });

  const esEdicion = modo === 'editar';

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="disciplinaId" className="mb-1 block text-sm font-medium text-slate-700">
            Disciplina
          </label>
          <Select id="disciplinaId" disabled={esEdicion} {...register('disciplinaId')}>
            <option value="">Seleccioná una disciplina</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nombre}
              </option>
            ))}
          </Select>
          {errors.disciplinaId && (
            <p className="mt-1 text-xs text-red-600">{errors.disciplinaId.message}</p>
          )}
        </div>

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
        {isSubmitting
          ? 'Guardando...'
          : esEdicion
            ? 'Guardar cambios'
            : 'Configurar cuota'}
      </Button>
    </form>
  );
}
