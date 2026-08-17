import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select } from '@/components/ui';
import { cuotaFormSchema, type FeeFormInput, type FeeFormValues } from '../schemas';
import type { MemberCategory, SportsFeeConfig, Discipline } from '../types';

interface CuotaFormProps {
  modo: 'crear' | 'editar';
  configuracionInicial?: SportsFeeConfig | null;
  disciplinas: Discipline[];
  categorias: MemberCategory[];
  onSubmit: (values: FeeFormValues) => Promise<void>;
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
export function FeeForm({
  modo,
  configuracionInicial,
  disciplinas,
  categorias,
  onSubmit,
}: CuotaFormProps) {
  const defaultValues = configuracionInicial
    ? {
        disciplineId: configuracionInicial.disciplineId,
        categoryId: configuracionInicial.categoryId,
        amount: configuracionInicial.amount,
        appliedPeriod: configuracionInicial.appliedPeriod,
      }
    : { disciplineId: '', categoryId: '', amount: '', appliedPeriod: '' };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeeFormInput, unknown, FeeFormValues>({
    resolver: zodResolver(cuotaFormSchema),
    defaultValues,
  });

  const esEdicion = modo === 'editar';

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="disciplineId" className="mb-1 block text-sm font-medium text-slate-700">
            Discipline
          </label>
          <Select id="disciplineId" disabled={esEdicion} {...register('disciplineId')}>
            <option value="">Seleccioná una disciplina</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.name}
              </option>
            ))}
          </Select>
          {errors.disciplineId && (
            <p className="mt-1 text-xs text-red-600">{errors.disciplineId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-slate-700">
            Categoría
          </label>
          <Select id="categoryId" disabled={esEdicion} {...register('categoryId')}>
            <option value="">Seleccioná una categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && (
            <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>
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
        error={errors.amount?.message as string | undefined}
        {...register('amount')}
      />

      <Input
        id="appliedPeriod"
        type="month"
        min={proximoPeriodo()}
        label="Período de aplicación"
        disabled={esEdicion}
        error={errors.appliedPeriod?.message as string | undefined}
        {...register('appliedPeriod')}
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
