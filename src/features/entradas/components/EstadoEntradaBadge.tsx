import { Ban, CheckCircle2, CircleSlash, Clock3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ClaveEstadoEntrada } from '../utils/estadoEntrada';

const CONFIG: Record<ClaveEstadoEntrada, { label: string; icon: LucideIcon; clase: string }> = {
  VALIDA: {
    label: 'Válida',
    icon: CheckCircle2,
    clase: 'bg-emerald-50 text-emerald-700 ring-emerald-600/25',
  },
  USADA: { label: 'Usada', icon: CircleSlash, clase: 'bg-slate-100 text-slate-600 ring-slate-500/25' },
  VENCIDA: { label: 'Vencida', icon: Clock3, clase: 'bg-amber-50 text-amber-800 ring-amber-600/25' },
  CANCELADA: { label: 'Cancelada', icon: Ban, clase: 'bg-rose-50 text-rose-700 ring-rose-600/25' },
};

/** TASK-60 — Estado de una entrada con ícono, color y texto (nunca solo color). */
export function EstadoEntradaBadge({
  estado,
  className,
  ...props
}: { estado: ClaveEstadoEntrada; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const { label, icon: Icon, clase } = CONFIG[estado];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        clase,
        className,
      )}
      {...props}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden />
      {label}
    </span>
  );
}
