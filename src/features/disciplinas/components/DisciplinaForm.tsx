import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@/components/ui';
import { disciplinaSchema, type DisciplinaFormValues } from '../schemas/disciplina.schema';
import { RequerimientosDocEditor } from './RequerimientosDocEditor';
import type { Disciplina } from '../types';

interface DisciplinaFormProps {
  disciplina?: Disciplina | null;
  guardando?: boolean;
  onSubmit: (values: DisciplinaFormValues) => Promise<void>;
  onCancel: () => void;
}

const valoresIniciales: DisciplinaFormValues = {
  nombre: '',
  descripcion: '',
  genero: undefined,
  edadMinima: null,
  edadMaxima: null,
  solicitaDocumentacion: false,
  activo: true,
  requerimientosDocumentacion: [],
};

export function DisciplinaForm({ disciplina, guardando = false, onSubmit, onCancel }: DisciplinaFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DisciplinaFormValues>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: disciplina
      ? {
          nombre: disciplina.nombre,
          descripcion: disciplina.descripcion ?? '',
          genero: disciplina.genero ?? undefined,
          edadMinima: disciplina.edadMinima ?? null,
          edadMaxima: disciplina.edadMaxima ?? null,
          solicitaDocumentacion: disciplina.solicitaDocumentacion,
          activo: disciplina.activo,
          requerimientosDocumentacion: disciplina.requerimientosDoc.map((requisito) => ({
            tipoDocumento: requisito.tipoDocumento,
            plazoDiasTolerancia: requisito.plazoDiasTolerancia,
          })),
        }
      : valoresIniciales,
  });
  const solicitaDocumentacion = watch('solicitaDocumentacion');
  const requerimientosDocumentacion = watch('requerimientosDocumentacion');

  return (
    <form className="max-w-2xl space-y-6" onSubmit={(evento) => void handleSubmit(onSubmit)(evento)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" placeholder="ej. natación" error={errors.nombre?.message} {...register('nombre')} />
        <div>
          <label htmlFor="genero" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Género
          </label>
          <Select id="genero" {...register('genero', { setValueAs: (value) => value === '' ? undefined : value })}>
            <option value="">Sin restricción</option>
            <option value="FEMENINO">Femenino</option>
            <option value="MASCULINO">Masculino</option>
            <option value="NO_BINARIO_NO_ESPECIFICADO">No binario / No especificado</option>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="activo" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Estado
        </label>
        <Select id="activo" {...register('activo', { setValueAs: (value) => value === 'true' })}>
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </Select>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          rows={3}
          placeholder="describí brevemente la disciplina"
          className="w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          {...register('descripcion')}
        />
        {errors.descripcion && <p className="mt-1 text-xs font-medium text-rose-600">{errors.descripcion.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Edad mínima"
          type="number"
          min={0}
          placeholder="sin mínimo"
          error={errors.edadMinima?.message}
          {...register('edadMinima', { setValueAs: (value) => value === '' ? null : Number(value) })}
        />
        <Input
          label="Edad máxima"
          type="number"
          min={0}
          placeholder="sin máximo"
          error={errors.edadMaxima?.message}
          {...register('edadMaxima', { setValueAs: (value) => value === '' ? null : Number(value) })}
        />
        <p className="text-xs text-slate-500 sm:col-span-2">Edad que el participante cumple en el año (por año de nacimiento). Cada categoría puede afinar este rango.</p>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" {...register('solicitaDocumentacion')} />
          <span>
            <span className="block font-semibold text-slate-900">Solicita documentación</span>
            <span className="text-xs text-slate-500">Permite una participación provisoria durante el plazo configurado.</span>
          </span>
        </label>

        {solicitaDocumentacion && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <RequerimientosDocEditor
              id="tipo-documentacion"
              label="Documentación requerida y plazo individual"
              value={requerimientosDocumentacion}
              onChange={(requerimientos) => setValue('requerimientosDocumentacion', requerimientos, { shouldValidate: true })}
              error={errors.requerimientosDocumentacion?.message}
            />
          </div>
        )}
      </fieldset>

      <div className="flex justify-start gap-3">
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : disciplina ? 'Guardar cambios' : 'Crear disciplina'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
