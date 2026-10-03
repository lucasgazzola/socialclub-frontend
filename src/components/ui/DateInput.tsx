import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { displayAIso, enmascararFecha, isoADisplay } from '@/lib/utils/fecha';

interface DateInputProps {
  /** Fecha en ISO (aaaa-mm-dd) o "" si no hay. */
  value: string | null | undefined;
  /** Recibe la fecha en ISO, o "" mientras esté vacía, incompleta o no exista. */
  onChange: (iso: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  id?: string;
  name?: string;
  /** Límites en ISO para el calendario. La validación de negocio sigue en el schema. */
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Selector de fecha del design system (DT-40): muestra y acepta dd/mm/aaaa sin
 * importar el idioma del navegador. Se escribe con máscara o se elige con el
 * calendario nativo (botón), y entrega siempre la fecha en ISO.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onBlur, label, error, id, name, min, max, disabled, className, containerClassName }, ref) => {
    const idGenerado = useId();
    const inputId = id ?? idGenerado;
    const [texto, setTexto] = useState(() => isoADisplay(value));
    const calendarioRef = useRef<HTMLInputElement>(null);

    // Si el valor cambia desde afuera (reset del formulario, calendario), se refleja.
    useEffect(() => {
      setTexto((actual) => (displayAIso(actual) === (value || null) ? actual : isoADisplay(value)));
    }, [value]);

    const completoPeroInvalido = texto.length === 10 && displayAIso(texto) === null;
    const mensaje = error ?? (completoPeroInvalido ? 'La fecha no es válida' : undefined);

    function escribir(entrada: string) {
      const enmascarado = enmascararFecha(entrada);
      setTexto(enmascarado);
      onChange(displayAIso(enmascarado) ?? '');
    }

    function abrirCalendario() {
      const calendario = calendarioRef.current;
      if (!calendario) return;
      calendario.value = value ?? '';
      if (typeof calendario.showPicker === 'function') calendario.showPicker();
      else calendario.focus();
    }

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={texto}
            disabled={disabled}
            aria-invalid={mensaje ? true : undefined}
            onChange={(evento) => escribir(evento.target.value)}
            onBlur={onBlur}
            className={cn(
              'flex h-9.5 w-full rounded-lg border bg-white py-1.5 pl-3 pr-9 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors',
              'placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50',
              mensaje
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200/90 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15',
              className,
            )}
          />
          <button
            type="button"
            aria-label={label ? `Elegir ${label.toLowerCase()} en el calendario` : 'Elegir fecha en el calendario'}
            disabled={disabled}
            onClick={abrirCalendario}
            className="absolute right-1.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <CalendarDays size={16} />
          </button>
          {/* Calendario nativo oculto: solo se usa su selector, el valor es ISO en cualquier idioma. */}
          <input
            ref={calendarioRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            min={min}
            max={max}
            className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
            onChange={(evento) => {
              setTexto(isoADisplay(evento.target.value));
              onChange(evento.target.value);
            }}
          />
        </div>
        {mensaje && <p className="mt-1 text-xs font-medium text-rose-600">{mensaje}</p>}
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
