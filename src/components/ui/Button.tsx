import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-brand-400 active:scale-[0.99]',
  secondary:
    'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] focus-visible:ring-slate-300 active:scale-[0.99]',
  outline:
    'border border-slate-300/80 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300',
  ghost:
    'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-slate-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-rose-300 active:scale-[0.99]',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] focus-visible:ring-emerald-300 active:scale-[0.99]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 py-2 text-sm',
  lg: 'h-10 px-5 text-base',
  icon: 'h-9 w-9 p-0',
};

/** Botón base del design system (Apex / shadcn). */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all select-none',
        'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
