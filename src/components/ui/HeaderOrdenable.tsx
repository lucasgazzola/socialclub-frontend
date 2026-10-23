import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type SentidoOrden = 'asc' | 'desc';

export interface HeaderOrdenableProps<T extends string = string> {
  campo: T;
  label: string;
  ordenarPor?: T;
  orden?: SentidoOrden;
  onOrdenar?: (campo: T) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function HeaderOrdenable<T extends string = string>({
  campo,
  label,
  ordenarPor,
  orden,
  onOrdenar,
  className,
  align = 'left',
}: HeaderOrdenableProps<T>) {
  const activo = Boolean(ordenarPor && ordenarPor === campo && orden);

  return (
    <th
      aria-sort={activo ? (orden === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-5 py-3.5', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}
    >
      <button
        type="button"
        onClick={() => onOrdenar?.(campo)}
        title={`Ordenar por ${label}`}
        className={cn(
          'group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors select-none focus:outline-hidden',
          align === 'right' && 'flex-row-reverse text-right'
        )}
      >
        <span>{label}</span>
        <span className="flex items-center" aria-hidden="true">
          {activo ? (
            orden === 'asc' ? (
              <ArrowUp size={13} className="text-brand-600 stroke-[2.5]" />
            ) : (
              <ArrowDown size={13} className="text-brand-600 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown
              size={13}
              className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          )}
        </span>
      </button>
    </th>
  );
}
