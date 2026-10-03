import { useState } from 'react';
import { Button, Spinner } from '@/components/ui';
import { useAuditoria } from '../hooks/useAuditoria';
import { AuditoriaTable } from '../components/AuditoriaTable';
import { AuditoriaFilters } from '../components/AuditoriaFilters';
import type { AuditoriaFiltrosFormValues } from '../schemas/auditoria-filtros.schema';
import type { AccionAuditoria } from '../constants';

const POR_PAGINA = 20;

export function AuditoriaPage() {
  const [filtros, setFiltros] = useState<AuditoriaFiltrosFormValues>({});
  const [pagina, setPagina] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useAuditoria({
    accion: (filtros.accion as AccionAuditoria) || undefined,
    entidad: filtros.entidad?.trim() || undefined,
    fechaDesde: filtros.fechaDesde || undefined,
    fechaHasta: filtros.fechaHasta || undefined,
    pagina,
    porPagina: POR_PAGINA,
  });

  const total = data?.total ?? 0;
  const porPagina = data?.porPagina ?? POR_PAGINA;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const hayResultados = (data?.items?.length ?? 0) > 0;

  function handleFiltrar(nuevosFiltros: AuditoriaFiltrosFormValues) {
    setPagina(1);
    setFiltros(nuevosFiltros);
  }

  function handleLimpiar() {
    setPagina(1);
    setFiltros({});
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

          {/* Paginación conectada con el total real del backend */}
          {hayResultados && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
              <span>
                {total} registro(s){isFetching ? ' · actualizando…' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1 || isFetching}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs font-medium text-slate-700">
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas || isFetching}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}