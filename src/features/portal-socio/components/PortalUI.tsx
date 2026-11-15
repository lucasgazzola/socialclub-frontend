import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { X, ChevronDown } from 'lucide-react';
import logoPng from '@/assets/Logo SocialClub 2.png';
import { cn } from '@/lib/utils/cn';

/**
 * Escudo / marca propia dentro del Portal de Socios (cero dependencia de @/components/ui).
 */
export function PortalBrandLogo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-[4px] border border-blue-400/20 bg-blue-500/[0.08] p-0.5',
        className,
      )}
    >
      <img src={logoPng} alt="Logo SocialClub" className="h-full w-full object-contain" loading="eager" />
    </div>
  );
}

/**
 * Indicador de carga propio del Portal de Socios con detalle azul.
 */
export function PortalSpinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400 motion-reduce:animate-none',
        className,
      )}
    />
  );
}

/**
 * Cabecera limpia de vista del Portal de Socios (sin subtítulos plantilla admin).
 */
export function PortalTitleBar({
  title,
  summary,
  actions,
}: {
  title: string;
  summary?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-300/[0.10] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-slate-50 sm:text-[26px]">
          {title}
        </h1>
        {summary && <p className="mt-1 text-sm text-slate-400">{summary}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

interface PortalSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pass' | 'muted';
}

/**
 * Superficie arquitectónica oscura con bordes afilados (6px) y tintes sutiles azul pizarra.
 */
export function PortalSurface({
  children,
  className,
  variant = 'default',
  ...props
}: PortalSurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-md border transition-[border-color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
        variant === 'default' && 'border-slate-300/[0.10] bg-[#0a101b]',
        variant === 'muted' && 'border-slate-300/[0.08] bg-[#070b14]',
        variant === 'pass' &&
          'border-blue-400/[0.22] bg-gradient-to-b from-[#0f1a2e] via-[#0b1322] to-[#080d18] shadow-[0_16px_40px_-22px_rgba(37,99,235,0.35)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function PortalButton({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: PortalButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[5px] font-medium select-none cursor-pointer',
        'transition-[transform,background-color,border-color,color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05080f]',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variant === 'primary' &&
          'border border-blue-400/35 bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:border-blue-300/45 hover:bg-blue-500',
        variant === 'secondary' &&
          'border border-slate-300/[0.16] bg-[#101827] text-slate-100 hover:border-blue-400/40 hover:bg-[#152035] hover:text-white',
        variant === 'ghost' &&
          'border border-transparent bg-transparent text-slate-300 hover:bg-blue-500/[0.10] hover:text-blue-300',
        variant === 'danger' &&
          'border border-rose-500/35 bg-rose-500/12 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-200',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Selector segmentado con geometría rectangular afilada y selección azul eléctrico.
 */
export function PortalSegmentedSwitch<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-[5px] border border-slate-300/[0.12] bg-[#070b14] p-1"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-[4px] px-3 py-1.5 text-xs font-medium cursor-pointer',
              'transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
              active
                ? 'bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  active ? 'bg-blue-950/50 text-blue-100' : 'bg-white/[0.06] text-slate-400',
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

type TagTone = 'active' | 'pending' | 'danger' | 'info' | 'neutral';

export function PortalTag({
  tone = 'neutral',
  dot = false,
  children,
  className,
}: {
  tone?: TagTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const toneClasses: Record<TagTone, string> = {
    active: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-300',
    pending: 'border-amber-400/25 bg-amber-500/12 text-amber-200',
    danger: 'border-rose-400/30 bg-rose-500/12 text-rose-300',
    info: 'border-blue-400/30 bg-blue-500/14 text-blue-300',
    neutral: 'border-slate-400/20 bg-slate-500/10 text-slate-300',
  };

  const dotColors: Record<TagTone, string> = {
    active: 'bg-emerald-400',
    pending: 'bg-amber-300',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium tracking-tight',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function PortalFieldInput({
  id,
  label,
  error,
  hint,
  className,
  readOnly,
  disabled,
  ...props
}: PortalInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          'block h-10 w-full rounded-[5px] border bg-[#070b14] px-3 text-sm text-slate-100 placeholder:text-slate-500',
          'transition-[border-color,background-color,box-shadow] duration-150',
          'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          (disabled || readOnly) && 'cursor-not-allowed border-slate-300/[0.07] bg-[#060911] text-slate-400',
          error
            ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/20'
            : 'border-slate-300/[0.15]',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

interface PortalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string | number; label: string }[];
}

export function PortalFieldSelect({
  id,
  label,
  error,
  hint,
  options,
  className,
  disabled,
  ...props
}: PortalSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full cursor-pointer appearance-none items-center rounded-[5px] border bg-[#070b14] pl-3 pr-9 text-sm text-slate-100',
            'transition-[border-color,background-color,box-shadow] duration-150',
            'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            disabled && 'cursor-not-allowed border-slate-300/[0.07] bg-[#060911] text-slate-400',
            error
              ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/20'
              : 'border-slate-300/[0.15]',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0a101b] text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

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
    <PortalSurface
      className="flex flex-col items-center justify-center px-6 py-12 text-center"
      variant="muted"
    >
      <div
        data-testid={testId}
        className="flex h-11 w-11 items-center justify-center rounded-[5px] border border-blue-400/20 bg-blue-500/[0.08] text-blue-400"
      >
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-slate-100">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </PortalSurface>
  );
}

/**
 * Modal oscuro propio del Portal de Socios (sin reutilizar Modal ni ConfirmDialog de Admin).
 */
export function PortalModal({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const widthClass =
    size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'portal-modal-panel relative max-h-[90vh] w-full overflow-y-auto rounded-md border border-slate-300/[0.16] bg-[#0a101b] text-slate-100 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)]',
          widthClass,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-300/[0.10] px-5 py-4">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border border-blue-400/25 bg-blue-500/12 text-blue-400">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h2>
              {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-slate-300/[0.12] bg-white/[0.03] text-slate-400 transition-colors hover:border-blue-400/35 hover:text-white cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Diálogo de confirmación oscuro propio del Portal de Socios.
 */
export function PortalConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <PortalModal open={open} onClose={loading ? () => {} : onCancel} title={title} size="sm">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-slate-300">{description}</p>
        <div className="flex justify-end gap-2.5 border-t border-slate-300/[0.10] pt-4">
          <PortalButton variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </PortalButton>
          <PortalButton
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </PortalButton>
        </div>
      </div>
    </PortalModal>
  );
}

/**
 * Portada / miniatura de evento para tarjetas y modales del Portal de Socios.
 * Si no hay fotografía válida o falla la carga, muestra una lámina obsidian con el escudo del club.
 */
export function PortalEventoVisual({
  nombre,
  imageUrl,
  tempImageUrl,
  className,
  logoSize = 52,
}: {
  nombre: string;
  imageUrl?: string | null;
  tempImageUrl?: string | null;
  className?: string;
  logoSize?: number;
}) {
  const src = tempImageUrl || imageUrl || '';
  const esPlaceholder = !src || src.includes('favicon-blanco.png') || src.includes('favicon.png');
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const mostrarFallback = esPlaceholder || failedSrc === src;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-[#070b14]',
        className,
      )}
    >
      {mostrarFallback ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(59,130,246,0.16),transparent_68%)]"
          />
          <div className="relative flex items-center justify-center p-4">
            <PortalBrandLogo size={logoSize} className="border-blue-400/25 bg-[#0a101b]/90 p-1.5" />
          </div>
        </>
      ) : (
        <img
          src={src}
          alt={nombre}
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
        />
      )}
    </div>
  );
}
