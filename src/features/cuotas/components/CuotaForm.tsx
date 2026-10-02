import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, ModalActions, Select } from '@/components/ui';
import { cuotaFormSchema, type CuotaFormInput, type CuotaFormValues } from '../schemas';
import type { ConfiguracionCuotaDeportiva, Disciplina } from '../types';

interface CuotaFormProps {
  modo: 'crear' | 'editar';
  configuracionInicial?: ConfiguracionCuotaDeportiva | null;
  disciplinas: Disciplina[];
  onSubmit: (values: CuotaFormValues) => Promise<void>;
  /** Cancelar dentro del modal (DT-20). */
  onCancel?: () => void;
}

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

/** Mes actual en formato "YYYY-MM" (la primera tarifa puede regir desde este mes). */
function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * US-20 · TASK-33 — Tarifa mensual de la cuota deportiva: de la disciplina
 * (base) o de una de sus categorías, con descuento opcional para socios. En
 * edición, disciplina, categoría y período quedan fijos (son la clave).
 */
export function CuotaForm({ modo, configuracionInicial, disciplinas, onSubmit, onCancel }: CuotaFormProps) {
  const defaultValues = configuracionInicial
    ? {
        disciplinaId: configuracionInicial.disciplinaId,
        categoriaDisciplinaId: configuracionInicial.categoriaDisciplinaId ?? '',
        monto: configuracionInicial.monto,
        descuentoSocioPorcentaje: configuracionInicial.descuentoSocioPorcentaje,
        periodoAplicacion: configuracionInicial.periodoAplicacion,
      }
    : { disciplinaId: '', categoriaDisciplinaId: '', monto: '', descuentoSocioPorcentaje: 0, periodoAplicacion: '' };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CuotaFormInput, unknown, CuotaFormValues>({
    resolver: zodResolver(cuotaFormSchema),
    defaultValues,
  });

  const esEdicion = modo === 'editar';
  const disciplinaId = Number(watch('disciplinaId')) || null;
  const categorias = (disciplinas.find((d) => d.id === disciplinaId)?.categorias ?? []).filter((c) => c.activo);
  const monto = Number(watch('monto')) || 0;
  const descuento = Number(watch('descuentoSocioPorcentaje')) || 0;

  // Al cambiar de disciplina, la categoría elegida deja de valer.
  useEffect(() => {
    if (!esEdicion) setValue('categoriaDisciplinaId', '');
  }, [disciplinaId, esEdicion, setValue]);

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
          {errors.disciplinaId && <p className="mt-1 text-xs text-red-600">{errors.disciplinaId.message}</p>}
        </div>

        <div>
          <label htmlFor="categoriaDisciplinaId" className="mb-1 block text-sm font-medium text-slate-700">
            Categoría
          </label>
          <Select id="categoriaDisciplinaId" disabled={esEdicion || !disciplinaId} {...register('categoriaDisciplinaId')}>
            <option value="">Toda la disciplina (tarifa base)</option>
            {esEdicion && configuracionInicial?.categoriaDisciplina && (
              <option value={configuracionInicial.categoriaDisciplina.id}>{configuracionInicial.categoriaDisciplina.nombre}</option>
            )}
            {!esEdicion &&
              categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
          </Select>
          <p className="mt-1 text-xs text-slate-500">La tarifa de una categoría reemplaza a la de la disciplina.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          id="descuentoSocioPorcentaje"
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          label="Descuento para socios (%)"
          placeholder="0"
          error={errors.descuentoSocioPorcentaje?.message as string | undefined}
          {...register('descuentoSocioPorcentaje')}
        />
      </div>

      {monto > 0 && descuento > 0 && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Un socio paga <strong>{formatoMoneda.format(Math.round(monto * (100 - descuento)) / 100)}</strong> por mes;
          quien no es socio, {formatoMoneda.format(monto)}.
        </p>
      )}

      <Input
        id="periodoAplicacion"
        type="month"
        min={periodoActual()}
        label="Rige desde"
        disabled={esEdicion}
        error={errors.periodoAplicacion?.message as string | undefined}
        {...register('periodoAplicacion')}
      />

      {!esEdicion && (
        <p className="text-xs text-slate-500">
          Los cambios rigen desde el mes siguiente. Si es la primera tarifa de la disciplina o categoría, puede regir
          desde este mes. Si no se indica, se usa el primer mes posible.
        </p>
      )}

      <ModalActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Configurar tarifa'}
        </Button>
      </ModalActions>
    </form>
  );
}
