import { cn } from '@/lib/utils/cn';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

/**
 * Campo selector del design system (Apex / shadcn).
 */
export function Select({ className, children, ...props }: SelectProps) {
  const hasWidth = className && /\bw-\S+/.test(className);

  return (
    <select
      className={cn(
        'flex h-9.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-all',
        'hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50',
        !hasWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
