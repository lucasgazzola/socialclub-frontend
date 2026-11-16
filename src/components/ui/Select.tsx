import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  leftIcon?: ReactNode;
}

/**
 * Campo selector del design system (Apex / shadcn).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, leftIcon, children, ...props }, ref) => {
    const hasWidth = className && /\b(w-\S+|min-w-\S+|max-w-\S+)/.test(className);

    if (!leftIcon) {
      return (
        <select
          ref={ref}
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

    return (
      <div className={cn('relative flex items-center', !hasWidth && 'w-full', className)}>
        <div className="pointer-events-none absolute left-3 z-10 flex items-center text-slate-400 [&_svg]:size-4">
          {leftIcon}
        </div>
        <select
          ref={ref}
          className={cn(
            'flex h-9.5 w-full rounded-lg border border-slate-200/90 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-all',
            'hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  },
);

Select.displayName = 'Select';

