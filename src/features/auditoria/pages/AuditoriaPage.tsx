import { useState } from 'react';
import { Button, Select, Spinner } from '@/components/ui';
import { useAuditoria } from '../hooks/useAuditoria';
import { AuditoriaTable } from '../components/AuditoriaTable';
import { ACCIONES_AUDITORIA } from '../constants';
import type { AccionAuditoria } from '../constants';

const POR_PAGINA = 20;

export function AuditoriaPage() {
  const [accion, setAccion] = useState<AccionAuditoria | undefined>(undefined);
  const [pagina, setPagina] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useAuditoria({
    accion,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Auditoría</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro inalterable de todas las operaciones del sistema.
          </p>
        </div>

        <Select
          id="accion"
          value={accion ?? ''}
          onChange={(e) => {
            setPagina(1);
            setAccion(e.target.value ? (e.target.value as AccionAuditoria) : undefined);
          }}
          className="min-w-[180px]"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES_AUDITORIA.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudo cargar el log de auditoría.'}
        </div>
      ) : (
        <>
          <AuditoriaTable registros={data?.items ?? []} />

          {hayResultados && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {data?.total ?? 0} registro(s){isFetching ? ' · actualizando…' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas}
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