import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, FileText, Info } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import {
  solicitarInscripcionSchema,
  type SolicitarInscripcionFormValues,
} from '../schemas/solicitar-inscripcion.schema';
import { useSolicitarInscripcion } from '../hooks/useSolicitarInscripcion';
import type { CategoriaCatalogo, DisciplinaCatalogo } from '../types';

interface Props {
  disciplina: DisciplinaCatalogo | null;
  open: boolean;
  onClose: () => void;
  esSocio?: boolean;
}

export function SolicitarInscripcionModal({ disciplina, open, onClose, esSocio }: Props) {
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState<number | null>(null);
  const selectId = useId();

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<SolicitarInscripcionFormValues>({
    resolver: zodResolver(solicitarInscripcionSchema),
    defaultValues: {
      disciplinaId: disciplina?.id ?? 0,
      categoriaDisciplinaId: undefined,
    },
  });

  const { solicitar, isPending } = useSolicitarInscripcion({
    onSuccess: () => {
      reset();
      setCategoriaSeleccionadaId(null);
      onClose();
    },
  });

  if (!disciplina) return null;

  const categorias = disciplina.categorias ?? [];
  const tieneCategorias = categorias.length > 0;

  // Si no hay categoría seleccionada pero hay categorías, toma la primera o ninguna
  const catActual: CategoriaCatalogo | undefined = categorias.find(
    (c) => c.id === categoriaSeleccionadaId,
  );

  const arancelMostrado = catActual
    ? catActual.arancelMensual
    : disciplina.arancelMensual;

  const docsObligatorios = catActual
    ? catActual.documentosObligatorios
    : disciplina.documentosObligatorios;

  const cumpleRestricciones = tieneCategorias
    ? catActual?.cumpleRestricciones ?? false
    : disciplina.cumpleRestricciones;

  const motivosIncumplimiento = tieneCategorias
    ? catActual?.motivosIncumplimiento ?? []
    : disciplina.motivosIncumplimiento;

  const handleCategoriaChange = (catId: number) => {
    setCategoriaSeleccionadaId(catId);
    setValue('categoriaDisciplinaId', catId || undefined, { shouldValidate: true });
  };

  const onSubmit = async () => {
    await solicitar({
      disciplinaId: disciplina.id,
      categoriaDisciplinaId: categoriaSeleccionadaId ?? undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Solicitar inscripción a ${disciplina.nombre}`}
      description="Postulate a la disciplina y categoría activa desde tu cuenta."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="form-solicitar-inscripcion">
        {disciplina.descripcion && (
          <p className="text-sm text-slate-600">{disciplina.descripcion}</p>
        )}

        {tieneCategorias ? (
          <div>
            <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">
              Categoría <span className="text-rose-500">*</span>
            </label>
            <select
              id={selectId}
              data-testid="select-categoria-solicitud"
              value={categoriaSeleccionadaId ?? ''}
              onChange={(e) => handleCategoriaChange(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="">-- Seleccioná una categoría --</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} {cat.cumpleRestricciones ? '' : '(No cumple restricciones)'}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Resumen de Arancel Mensual */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5" data-testid="arancel-mensual-info">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Arancel mensual
            </span>
            {disciplina.descuentoSocioPorcentaje > 0 && esSocio && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                {disciplina.descuentoSocioPorcentaje}% desc. socio aplicado
              </span>
            )}
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            ${arancelMostrado.toLocaleString('es-AR')}
            <span className="text-sm font-normal text-slate-500"> / mes</span>
          </div>
        </div>

        {/* Documentación obligatoria exigida */}
        <div className="space-y-2" data-testid="documentos-obligatorios-seccion">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <FileText size={14} />
            <span>Documentos obligatorios exigidos</span>
          </div>
          {docsObligatorios.length === 0 ? (
            <p className="text-xs text-slate-500">Esta disciplina no exige documentación obligatoria.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {docsObligatorios.map((doc) => (
                <li key={doc.tipoDocumento} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-medium text-slate-700">{doc.nombre}</span>
                  <span className="text-[11px] text-slate-400">
                    {doc.plazoDiasTolerancia === 0
                      ? 'Requerido al inicio'
                      : `${doc.plazoDiasTolerancia} días de tolerancia`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Validación de Restricciones */}
        {tieneCategorias && !categoriaSeleccionadaId ? (
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <span>Seleccioná una categoría para verificar si cumplís con los requisitos de edad y género.</span>
          </div>
        ) : !cumpleRestricciones ? (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            data-testid="alerta-incumplimiento-restricciones"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold text-rose-900">No cumplís con las restricciones para postularte:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-rose-700">
                {motivosIncumplimiento.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
            data-testid="alerta-cumple-restricciones"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>Cumplís con los parámetros de edad y género configurados para esta categoría.</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending || isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isPending ||
              isSubmitting ||
              (tieneCategorias && !categoriaSeleccionadaId) ||
              !cumpleRestricciones
            }
            data-testid="btn-confirmar-solicitud"
          >
            {isPending ? 'Enviando solicitud...' : 'Confirmar solicitud'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

