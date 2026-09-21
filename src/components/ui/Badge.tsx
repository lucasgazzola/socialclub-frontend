import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'success'
  | 'danger'
  | 'warning'
  | 'secondary'
  | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-brand-50 text-brand-700 border-brand-200/70',
  brand: 'bg-brand-50 text-brand-700 border-brand-200/70',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200/80',
  outline: 'border-slate-300 text-slate-700 bg-transparent',
};

/** Badge / Insignia píldora moderna del design system (Apex / shadcn). */
export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
