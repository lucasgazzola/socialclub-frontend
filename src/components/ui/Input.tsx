import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Campo de texto del design system (Apex / shadcn).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, leftIcon, className, containerClassName, ...props }, ref) => {
    const idGenerado = useId();
    const inputId = id ?? idGenerado;

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400 [&_svg]:size-4">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-9.5 w-full rounded-lg border bg-white px-3 py-1.5 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors',
              'placeholder:text-slate-400 focus:outline-none focus:ring-2',
              leftIcon && 'pl-9',
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200/90 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
