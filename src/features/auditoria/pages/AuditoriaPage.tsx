import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useAuditoria } from '../hooks/useAuditoria';
import { AuditoriaTable } from '../components/AuditoriaTable';
import { AuditoriaFilters } from '../components/AuditoriaFilters';
import type { AuditoriaFiltrosFormValues } from '../schemas/auditoria-filtros.schema';
import type { AccionAuditoria } from '../constants';

const POR_PAGINA_DEFAULT = 10;

export function AuditoriaPage() {
  const [filtros, setFiltros] = useState<AuditoriaFiltrosFormValues>({
    periodo: 'todo',
  });
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_DEFAULT);

  const esPersonalizado = filtros.periodo === 'personalizado';

  const { data, isLoading, isError, error, isFetching } = useAuditoria({
    accion: (filtros.accion as AccionAuditoria) || undefined,
    entidad: filtros.entidad?.trim() || undefined,
    periodo: filtros.periodo && filtros.periodo !== 'todo' ? filtros.periodo : undefined,
    fechaDesde: esPersonalizado ? filtros.fechaDesde || undefined : undefined,
    fechaHasta: esPersonalizado ? filtros.fechaHasta || undefined : undefined,
    pagina,
    porPagina,
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const hayResultados = (data?.items?.length ?? 0) > 0;

  const registroDesde = total > 0 ? (pagina - 1) * porPagina + 1 : 0;
  const registroHasta = total > 0 ? Math.min(pagina * porPagina, total) : 0;

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

  const paginasVisibles = generarPaginas(pagina, totalPaginas);

  function handleFiltrar(nuevosFiltros: AuditoriaFiltrosFormValues) {
    setPagina(1);
    setFiltros(nuevosFiltros);
  }

  function handleLimpiar() {
    setPagina(1);
    setFiltros({ periodo: 'todo' });
  }

  function handleCambiarPorPagina(nuevoPorPagina: number) {
    setPorPagina(nuevoPorPagina);
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado según ESTANDARES_UI_UX.md */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Auditoría</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro inalterable de todas las operaciones del sistema.
        </p>
      </header>

      {/* Componente de Filtros con React Hook Form + Zod */}
      <AuditoriaFilters
        onFiltrar={handleFiltrar}
        onLimpiar={handleLimpiar}
        filtrosActivos={filtros}
        deshabilitado={isLoading && !data}
      />

      {/* Estado de carga inicial */}
      {isLoading && !data ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudo cargar el log de auditoría.'}
        </div>
      ) : (
        <>
          {/* Tabla de auditoría */}
          <AuditoriaTable registros={data?.items ?? []} isFetching={isFetching} />

          {/* Barra de paginación completa con rango de resultados, selector de filas y páginas */}
          {hayResultados && (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
              {/* Izquierda: Mostrando X-Y de Z resultados (estilo Showing 1-3 of 3 results) */}
              <div>
                <span>
                  Mostrando {registroDesde}-{registroHasta} de {total} resultados
                </span>
                {isFetching && <span className="text-slate-400"> · actualizando…</span>}
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
                      onChange={(e) => handleCambiarPorPagina(Number(e.target.value))}
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
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 text-xs font-medium"
                  >
                    Anterior
                  </Button>

                  {paginasVisibles.map((p, idx) =>
                    typeof p === 'number' ? (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPagina(p)}
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
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="h-8 px-2.5 text-xs font-medium"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}