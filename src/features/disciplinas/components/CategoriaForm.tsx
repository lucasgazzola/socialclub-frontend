import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, ModalActions } from '@/components/ui';
import { categoriaSchema, type CategoriaFormValues } from '../schemas/categoria.schema';
import { RequerimientosDocEditor } from './RequerimientosDocEditor';
import {
  GENERO_DISCIPLINA_LABELS,
  describirAniosNacimiento,
  describirEdad,
  etiquetaPlazo,
  etiquetaTipoDocumento,
  restriccionesEfectivas,
  type CategoriaDisciplinaDetalle,
  type GeneroDisciplina,
  type RequerimientoDoc,
  type Restricciones,
} from '../types';

interface CategoriaFormProps {
  categoria?: CategoriaDisciplinaDetalle | null;
  /** Documentación que ya exige la disciplina: se hereda y se muestra como solo lectura. */
  requerimientosDisciplina: RequerimientoDoc[];
  /** Restricciones de la disciplina: la categoría las hereda o las afina dentro de ellas. */
  restriccionesDisciplina: Restricciones;
  guardando?: boolean;
  onSubmit: (values: CategoriaFormValues) => Promise<void>;
  onCancel: () => void;
}

const edadComoValor = (valor: unknown) => (valor === '' || valor === null ? null : Number(valor));

export function CategoriaForm({ categoria, requerimientosDisciplina, restriccionesDisciplina, guardando = false, onSubmit, onCancel }: CategoriaFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      genero: categoria?.genero ?? null,
      edadMinima: categoria?.edadMinima ?? null,
      edadMaxima: categoria?.edadMaxima ?? null,
      requerimientosDocumentacion: (categoria?.requerimientosDoc ?? []).map((requisito) => ({
        tipoDocumento: requisito.tipoDocumento,
        plazoDiasTolerancia: requisito.plazoDiasTolerancia,
      })),
    },
  });
  const requerimientos = watch('requerimientosDocumentacion');
  const efectivas = restriccionesEfectivas(restriccionesDisciplina, {
    genero: watch('genero'),
    edadMinima: watch('edadMinima'),
    edadMaxima: watch('edadMaxima'),
  });
  const aniosNacimiento = describirAniosNacimiento(efectivas);
  const herenciaGenero = restriccionesDisciplina.genero
    ? `Igual que la disciplina (${GENERO_DISCIPLINA_LABELS[restriccionesDisciplina.genero]})`
    : 'Cualquier género (igual que la disciplina)';

  return (
    <form className="space-y-6" onSubmit={(evento) => void handleSubmit(onSubmit)(evento)}>
      <Input label="Nombre" placeholder="ej. Sub-15, Primera" error={errors.nombre?.message} {...register('nombre')} />

      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-700">Restricciones</legend>
        <div>
          <label htmlFor="genero-categoria" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Género</label>
          <Select id="genero-categoria" {...register('genero', { setValueAs: (valor: string) => (valor === '' ? null : (valor as GeneroDisciplina)) })}>
            <option value="">{herenciaGenero}</option>
            {!restriccionesDisciplina.genero &&
              (Object.keys(GENERO_DISCIPLINA_LABELS) as GeneroDisciplina[]).map((genero) => (
                <option key={genero} value={genero}>{GENERO_DISCIPLINA_LABELS[genero]}</option>
              ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Edad mínima"
            type="number"
            min={restriccionesDisciplina.edadMinima ?? 0}
            max={restriccionesDisciplina.edadMaxima ?? undefined}
            placeholder={restriccionesDisciplina.edadMinima !== null ? `${restriccionesDisciplina.edadMinima} (disciplina)` : 'sin mínimo'}
            error={errors.edadMinima?.message}
            {...register('edadMinima', { setValueAs: edadComoValor })}
          />
          <Input
            label="Edad máxima"
            type="number"
            min={restriccionesDisciplina.edadMinima ?? 0}
            max={restriccionesDisciplina.edadMaxima ?? undefined}
            placeholder={restriccionesDisciplina.edadMaxima !== null ? `${restriccionesDisciplina.edadMaxima} (disciplina)` : 'sin máximo'}
            error={errors.edadMaxima?.message}
            {...register('edadMaxima', { setValueAs: edadComoValor })}
          />
        </div>
        <p className="text-xs text-slate-500">
          Edad que el participante cumple en el año (por año de nacimiento). Vacío = igual que la disciplina ({describirEdad(restriccionesDisciplina)}).
        </p>
        <p className="text-sm font-medium text-slate-700" aria-live="polite">
          Rige: {efectivas.genero ? GENERO_DISCIPLINA_LABELS[efectivas.genero] : 'cualquier género'} · {describirEdad(efectivas)}
          {aniosNacimiento && ` · ${aniosNacimiento} (temporada ${new Date().getFullYear()})`}
        </p>
      </fieldset>

      <section aria-labelledby="doc-heredada" className="space-y-2">
        <h3 id="doc-heredada" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Documentación que exige la disciplina
        </h3>
        {requerimientosDisciplina.length === 0 ? (
          <p className="text-sm text-slate-500">La disciplina no exige documentación.</p>
        ) : (
          <ul className="space-y-2">
            {requerimientosDisciplina.map((requisito) => (
              <li key={requisito.tipoDocumento} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span>{etiquetaTipoDocumento(requisito.tipoDocumento)}</span>
                <span className="text-xs text-slate-500">{etiquetaPlazo(requisito.plazoDiasTolerancia)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <RequerimientosDocEditor
          id="tipo-documentacion-categoria"
          label="Documentación adicional de la categoría"
          value={requerimientos}
          onChange={(nuevos) => setValue('requerimientosDocumentacion', nuevos, { shouldValidate: true })}
          tiposExcluidos={requerimientosDisciplina.map((requisito) => requisito.tipoDocumento)}
          error={errors.requerimientosDocumentacion?.message}
        />
        {categoria && (
          <p className="mt-3 text-xs text-slate-500">
            Un documento que agregues se exige también a los participantes ya inscriptos, con el plazo contado desde hoy.
          </p>
        )}
      </fieldset>

      <ModalActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear categoría'}</Button>
      </ModalActions>
    </form>
  );
}
