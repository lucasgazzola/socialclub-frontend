import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/** Encabezado de página nativo del Portal de Socios (sin kickers/eyebrows ni estilos de backoffice). */
export function PortalPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[28px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </header>
  );
}

/** Contenedor oscuro estilo Global Fan con bordes de pelo y sombreado direccional. */
export function PortalPanel({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'pass';
  className?: string;
}) {
  const styles = {
    default: 'border-white/[0.08] bg-[#0d1016]',
    elevated: 'border-white/[0.11] bg-[#131720]',
    pass: 'border-white/[0.12] bg-gradient-to-br from-[#141923] via-[#0d1016] to-[#080a0e]',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-[0_12px_32px_-12px_rgba(0,0,0,0.75)]',
        styles,
        className,
      )}
    >
      {children}
    </div>
  );
}

type PortalButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type PortalButtonSize = 'sm' | 'md';

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PortalButtonVariant;
  size?: PortalButtonSize;
}

/** Botón táctil con feedback físico (`scale(0.97)`) y curva `ease-out` de Design Engineering. */
export const PortalButton = forwardRef<HTMLButtonElement, PortalButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, type = 'button', ...props }, ref) => {
    const variantClasses: Record<PortalButtonVariant, string> = {
      primary:
        'bg-white text-zinc-950 hover:bg-zinc-200 font-medium shadow-xs disabled:bg-zinc-700 disabled:text-zinc-400',
      secondary:
        'border border-white/[0.11] bg-white/[0.05] text-zinc-100 hover:bg-white/[0.09] hover:border-white/[0.18] font-medium disabled:opacity-45',
      ghost:
        'text-zinc-400 hover:bg-white/[0.06] hover:text-white font-medium disabled:opacity-45',
      danger:
        'border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 font-medium disabled:opacity-45',
    };

    const sizeClasses: Record<PortalButtonSize, string> = {
      sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-full',
      md: 'h-10 px-5 text-sm gap-2 rounded-full',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap select-none cursor-pointer',
          'transition-[transform,background-color,border-color,color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
          'active:scale-[0.97] disabled:active:scale-100 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/75',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
PortalButton.displayName = 'PortalButton';

export interface PortalTabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Control segmentado estilo cápsula oscura (reemplaza el StatusTabs claro del backoffice). */
export function PortalSegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = 'Opciones de vista',
}: {
  tabs: PortalTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/[0.08] bg-[#0d1016] p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium select-none cursor-pointer',
              'transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/75',
              active
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  active
                    ? 'bg-zinc-900/12 text-zinc-950'
                    : 'bg-white/[0.07] text-zinc-400',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type PillTone = 'active' | 'pending' | 'danger' | 'info' | 'neutral';

export function PortalStatusPill({
  tone = 'neutral',
  dot = false,
  children,
  className,
}: {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const toneClasses: Record<PillTone, string> = {
    active: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    pending: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    danger: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
    info: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
    neutral: 'border-white/10 bg-white/[0.05] text-zinc-300',
  };

  const dotClasses: Record<PillTone, string> = {
    active: 'bg-emerald-400',
    pending: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    neutral: 'bg-zinc-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotClasses[tone])} />}
      {children}
    </span>
  );
}

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PortalInput = forwardRef<HTMLInputElement, PortalInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border bg-[#07090d] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500',
          'transition-[border-color,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
          'focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/10',
          'disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-zinc-500 disabled:border-white/[0.06]',
          'read-only:bg-white/[0.03] read-only:text-zinc-400 read-only:border-white/[0.06]',
          error ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/15' : 'border-white/[0.11]',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-400" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  ),
);
PortalInput.displayName = 'PortalInput';

interface PortalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const PortalSelect = forwardRef<HTMLSelectElement, PortalSelectProps>(
  ({ label, error, hint, id, options, placeholder, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border bg-[#07090d] px-3.5 py-2.5 text-sm text-white',
          'transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
          'focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/10',
          'disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-zinc-500',
          error ? 'border-rose-500/60' : 'border-white/[0.11]',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-[#0d1016] text-zinc-400">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0d1016] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-rose-400" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  ),
);
PortalSelect.displayName = 'PortalSelect';

/** Estado vacío que orienta al usuario hacia su próxima acción disponible. */
export function PortalEmptyState({
  icon,
  title,
  description,
  action,
  testId,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <PortalPanel className="px-6 py-12 text-center" >
      <div data-testid={testId} className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-zinc-400">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </PortalPanel>
  );
}
