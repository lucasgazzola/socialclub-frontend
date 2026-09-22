import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@/components/ui';
import { disciplinaSchema, type DisciplinaFormValues } from '../schemas/disciplina.schema';
import { TIPOS_DOCUMENTACION_DISCIPLINA, type Disciplina, type TipoDocumentacionDisciplina } from '../types';

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
  const [tipoNuevo, setTipoNuevo] = useState<TipoDocumentacionDisciplina | ''>('');
  const [plazoNuevo, setPlazoNuevo] = useState('0');
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

  function agregarTipo() {
    if (tipoNuevo && !requerimientosDocumentacion.some((requisito) => requisito.tipoDocumento === tipoNuevo)) {
      setValue('requerimientosDocumentacion', [
        ...requerimientosDocumentacion,
        { tipoDocumento: tipoNuevo, plazoDiasTolerancia: Number(plazoNuevo) || 0 },
      ], { shouldValidate: true });
      setTipoNuevo('');
      setPlazoNuevo('0');
    }
  }

  function quitarTipo(tipo: TipoDocumentacionDisciplina) {
    setValue('requerimientosDocumentacion', requerimientosDocumentacion.filter((actual) => actual.tipoDocumento !== tipo), { shouldValidate: true });
  }

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
            <div>
              <label htmlFor="tipo-documentacion" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Documentación requerida y plazo individual
              </label>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                <Select id="tipo-documentacion" value={tipoNuevo} onChange={(evento) => setTipoNuevo(evento.target.value as TipoDocumentacionDisciplina | '')}>
                  <option value="">Seleccionar tipo</option>
                  {TIPOS_DOCUMENTACION_DISCIPLINA.filter((opcion) => !requerimientosDocumentacion.some((requisito) => requisito.tipoDocumento === opcion.value)).map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                  ))}
                </Select>
                <Input
                  aria-label="Plazo de tolerancia del documento"
                  type="number"
                  min={0}
                  value={plazoNuevo}
                  onChange={(evento) => setPlazoNuevo(evento.target.value)}
                  placeholder="0 = inmediato"
                />
                <Button type="button" variant="secondary" size="icon" aria-label="Agregar tipo" onClick={agregarTipo}>
                  <Plus size={16} />
                </Button>
              </div>
              {errors.requerimientosDocumentacion && <p className="mt-1 text-xs font-medium text-rose-600">{errors.requerimientosDocumentacion.message}</p>}
              <div className="mt-3 space-y-2">
                {requerimientosDocumentacion.map((requisito) => (
                  <div key={requisito.tipoDocumento} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{TIPOS_DOCUMENTACION_DISCIPLINA.find((opcion) => opcion.value === requisito.tipoDocumento)?.label}</span>
                    <span className="flex items-center gap-3 text-xs text-slate-500">{requisito.plazoDiasTolerancia === 0 ? 'Obligatorio al inscribirse' : `${requisito.plazoDiasTolerancia} días de tolerancia`}
                      <button type="button" aria-label={`Quitar ${requisito.tipoDocumento}`} onClick={() => quitarTipo(requisito.tipoDocumento)} className="rounded-full p-1 text-rose-600 hover:bg-rose-50"><X size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
