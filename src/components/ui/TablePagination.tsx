import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from './Button';

export interface TablePaginationProps {
  pagina: number;
  porPagina: number;
  total: number;
  isFetching?: boolean;
  onChangePagina: (nuevaPagina: number) => void;
  onChangePorPagina: (nuevoPorPagina: number) => void;
  srSummary?: string;
}

function generarPaginas(actual: number, totalPags: number): (number | '...')[] {
  if (totalPags <= 7) {
    return Array.from({ length: totalPags }, (_, i) => i + 1);
  }
  if (actual <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPags];
  }
  if (actual >= totalPags - 3) {
    return [1, '...', totalPags - 4, totalPags - 3, totalPags - 2, totalPags - 1, totalPags];
  }
  return [1, '...', actual - 1, actual, actual + 1, '...', totalPags];
}

export function TablePagination({
  pagina,
  porPagina,
  total,
  isFetching = false,
  onChangePagina,
  onChangePorPagina,
  srSummary,
}: TablePaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const registroDesde = total > 0 ? (pagina - 1) * porPagina + 1 : 0;
  const registroHasta = total > 0 ? Math.min(pagina * porPagina, total) : 0;
  const paginasVisibles = generarPaginas(pagina, totalPaginas);

  return (
    <div
      style={{ marginTop: '16px' }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500"
    >
      {/* Izquierda: Mostrando X-Y de Z resultados */}
      <div style={{ marginTop: '-1px' }}>
        <span>
          Mostrando {registroDesde}-{registroHasta} de {total} resultados
        </span>
        {isFetching && <span className="text-slate-400"> · actualizando…</span>}
        {srSummary && <span className="hidden">{srSummary}</span>}
        <span className="hidden">
          Página {pagina} de {totalPaginas}
        </span>
      </div>

      {/* Derecha: Selector de filas + Botonera de páginas */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="porPagina" className="text-slate-500">
            Filas
          </label>
          <div className="relative">
            <select
              id="porPagina"
              aria-label="Filas por página"
              value={porPagina}
              onChange={(e) => onChangePorPagina(Number(e.target.value))}
              disabled={isFetching}
              className="h-8 rounded-lg border border-slate-200/90 bg-white pl-2.5 pr-7 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 cursor-pointer appearance-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagina <= 1 || isFetching}
            onClick={() => onChangePagina(Math.max(1, pagina - 1))}
            className="h-8 px-2.5 text-xs font-medium"
          >
            Anterior
          </Button>

          {paginasVisibles.map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                onClick={() => onChangePagina(p)}
                disabled={isFetching}
                aria-label={`Página ${p}`}
                aria-current={p === pagina ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-all select-none',
                  p === pagina
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'border border-slate-200/90 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {p}
              </button>
            ) : (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-8 w-5 items-center justify-center text-xs text-slate-400"
              >
                …
              </span>
            ),
          )}

          <Button
            variant="secondary"
            size="sm"
            disabled={pagina >= totalPaginas || isFetching}
            onClick={() => onChangePagina(Math.min(totalPaginas, pagina + 1))}
            className="h-8 px-2.5 text-xs font-medium"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
