import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { enmascararHora } from '@/lib/utils/fecha';
import { DateInput } from './DateInput';

interface DateTimeInputProps {
  /** Valor en el formato de `datetime-local` ("aaaa-mm-ddThh:mm") o "" si no hay. */
  value: string | null | undefined;
  /** Recibe "aaaa-mm-ddThh:mm", o "" mientras falte la fecha o la hora. */
  onChange: (valor: string) => void;
  onBlur?: () => void;
  /** Id del campo de fecha (al que apunta el `<label htmlFor>` de afuera). */
  id?: string;
  /** Texto para el lector de pantalla del campo de hora, p. ej. "Hora de inicio". */
  etiquetaHora?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function separar(valor: string | null | undefined) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(valor ?? '');
  return m ? { fecha: m[1], hora: m[2] } : { fecha: '', hora: '' };
}

/**
 * Fecha y hora del design system, reemplazo de `<input type="datetime-local">`
 * (DT-40): el nativo muestra la fecha en el formato del navegador (mm/dd en
 * inglés) y la hora en 12 h según el idioma. Este muestra siempre dd/mm/aaaa y
 * hh:mm (24 h), y entrega el mismo valor que `datetime-local`, así que el
 * schema y el envío no cambian.
 */
export function DateTimeInput({
  value,
  onChange,
  onBlur,
  id,
  etiquetaHora = 'Hora',
  invalid,
  disabled,
  className,
}: DateTimeInputProps) {
  const idGenerado = useId();
  const fechaId = id ?? idGenerado;
  const inicial = separar(value);
  const [fecha, setFecha] = useState(inicial.fecha);
  const [hora, setHora] = useState(inicial.hora);

  // Si el valor cambia desde afuera (reset del formulario, edición), se refleja.
  useEffect(() => {
    const externo = separar(value);
    if (externo.fecha) {
      setFecha(externo.fecha);
      setHora(externo.hora);
    } else if (!value && fecha && HORA.test(hora)) {
      // Estaba completo y llegó vacío: lo limpiaron desde afuera (reset).
      setFecha('');
      setHora('');
    }
    // Solo reacciona al valor externo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function emitir(nuevaFecha: string, nuevaHora: string) {
    onChange(nuevaFecha && HORA.test(nuevaHora) ? `${nuevaFecha}T${nuevaHora}` : '');
  }

  const horaIncompleta = !!fecha && !HORA.test(hora);
  const horaInvalida = hora.length === 5 && !HORA.test(hora);

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
        <DateInput
          id={fechaId}
          value={fecha}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(iso) => {
            setFecha(iso);
            emitir(iso, hora);
          }}
          className={invalid ? 'border-rose-400' : undefined}
        />
        <input
          id={`${fechaId}-hora`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="hh:mm"
          maxLength={5}
          aria-label={etiquetaHora}
          aria-invalid={horaInvalida || invalid ? true : undefined}
          value={hora}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(e) => {
            const enmascarada = enmascararHora(e.target.value);
            setHora(enmascarada);
            emitir(fecha, enmascarada);
          }}
          className={cn(
            'flex h-9.5 w-full rounded-lg border bg-white px-3 py-1.5 text-sm tabular-nums text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50',
            horaInvalida || invalid
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15',
          )}
        />
      </div>
      {horaInvalida ? (
        <p className="mt-1 text-xs font-medium text-rose-600">La hora no es válida (00:00 a 23:59)</p>
      ) : horaIncompleta && hora.length > 0 ? (
        <p className="mt-1 text-xs text-slate-500">Completá la hora (hh:mm)</p>
      ) : horaIncompleta ? (
        <p className="mt-1 text-xs text-slate-500">Falta la hora</p>
      ) : null}
    </div>
  );
}
