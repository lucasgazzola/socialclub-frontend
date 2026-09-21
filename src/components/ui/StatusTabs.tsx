import { cn } from '@/lib/utils/cn';

export interface StatusTabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface StatusTabsProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  tabs: StatusTabItem<T>[];
  className?: string;
  'aria-label'?: string;
}

/**
 * Filtro de pestañas segmentadas estilo Apex / shadcn para selección de estado.
 */
export function StatusTabs<T extends string = string>({
  value,
  onChange,
  tabs,
  className,
  'aria-label': ariaLabel = 'Pestañas de estado',
}: StatusTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/90 p-1 text-xs font-medium text-slate-600',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 select-none',
              isActive
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-slate-200/70 text-slate-600',
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
