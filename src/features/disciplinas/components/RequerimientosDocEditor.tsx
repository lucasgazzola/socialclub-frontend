import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import {
  TIPOS_DOCUMENTACION_DISCIPLINA,
  etiquetaPlazo,
  etiquetaTipoDocumento,
  type RequerimientoDocPayload,
  type TipoDocumentacionDisciplina,
} from '../types';

interface RequerimientosDocEditorProps {
  id: string;
  label: string;
  value: RequerimientoDocPayload[];
  onChange: (requerimientos: RequerimientoDocPayload[]) => void;
  /** Tipos que no se ofrecen (ej. los que ya exige la disciplina, en una categoría). */
  tiposExcluidos?: TipoDocumentacionDisciplina[];
  error?: string;
}

/**
 * Selección de documentación obligatoria del catálogo, con el plazo en días
 * para presentarla desde la inscripción (0 = obligatoria al inscribirse).
 * Lo usan la disciplina (US-44/45) y la categoría (US-48/49).
 */
export function RequerimientosDocEditor({ id, label, value, onChange, tiposExcluidos = [], error }: RequerimientosDocEditorProps) {
  const [tipoNuevo, setTipoNuevo] = useState<TipoDocumentacionDisciplina | ''>('');
  const [plazoNuevo, setPlazoNuevo] = useState('0');
  const disponibles = TIPOS_DOCUMENTACION_DISCIPLINA.filter(
    (opcion) => !tiposExcluidos.includes(opcion.value) && !value.some((requisito) => requisito.tipoDocumento === opcion.value),
  );

  function agregar() {
    if (!tipoNuevo) return;
    onChange([...value, { tipoDocumento: tipoNuevo, plazoDiasTolerancia: Math.max(0, Number(plazoNuevo) || 0) }]);
    setTipoNuevo('');
    setPlazoNuevo('0');
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
        <Select id={id} value={tipoNuevo} onChange={(evento) => setTipoNuevo(evento.target.value as TipoDocumentacionDisciplina | '')}>
          <option value="">Seleccionar tipo</option>
          {disponibles.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
          ))}
        </Select>
        <Input
          aria-label="Plazo en días para presentar el documento"
          type="number"
          min={0}
          value={plazoNuevo}
          onChange={(evento) => setPlazoNuevo(evento.target.value)}
          placeholder="0 = al inscribirse"
        />
        <Button type="button" variant="secondary" size="icon" aria-label="Agregar tipo" onClick={agregar}>
          <Plus size={16} />
        </Button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Plazo en días desde la inscripción. 0 = obligatorio al inscribirse.</p>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      <div className="mt-3 space-y-2">
        {value.map((requisito) => (
          <div key={requisito.tipoDocumento} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <span className="font-medium text-slate-700">{etiquetaTipoDocumento(requisito.tipoDocumento)}</span>
            <span className="flex items-center gap-3 text-xs text-slate-500">
              {etiquetaPlazo(requisito.plazoDiasTolerancia)}
              <button
                type="button"
                aria-label={`Quitar ${etiquetaTipoDocumento(requisito.tipoDocumento)}`}
                onClick={() => onChange(value.filter((actual) => actual.tipoDocumento !== requisito.tipoDocumento))}
                className="rounded-full p-1 text-rose-600 hover:bg-rose-50"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
