import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Select, Spinner } from '@/components/ui';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaSocialForm } from '../components/CuotaSocialForm';
import { CuotaSocialTable } from '../components/CuotaSocialTable';
import { useConfigurarCuotaSocial } from '../hooks/useConfigurarCuotaSocial';
import { useCuotaSocial } from '../hooks/useCuotaSocial';
import type { CuotaSocialFormValues } from '../schemas';
import { ROUTES } from '@/routes/paths';

const POR_PAGINA = 10;

export function CuotaSocialPage() {
  const navigate = useNavigate();

  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [periodoInput, setPeriodoInput] = useState('');
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: categorias = [] } = useCategorias();
  const configurarCuota = useConfigurarCuotaSocial();

  const { data, isLoading, isError, error, isFetching } = useCuotaSocial({
    categoriaId,
    periodoAplicacion: periodo || undefined,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  async function handleCrear(values: CuotaSocialFormValues) {
    await configurarCuota.mutateAsync({
      categoriaId: values.categoriaId,
      monto: values.monto,
      ...(values.periodoAplicacion ? { periodoAplicacion: values.periodoAplicacion } : {}),
    });
    setModalAbierto(false);
  }

  function aplicarPeriodo() {
    setPagina(1);
    setPeriodo(periodoInput.trim() || undefined);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.cuotas)}>
              <ArrowLeft size={16} />
              Volver a Cuotas
            </Button>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Cuota social</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configurá el monto mensual de la cuota social por categoría. Los cambios aplican desde el
            período siguiente.
          </p>
        </div>

        <Button onClick={() => setModalAbierto(true)}>
          <Plus size={16} />
          Configurar cuota social
        </Button>
      </header>

      <Modal
        open={modalAbierto}
        title="Nueva cuota social"
        description="Elegí la categoría y definí el monto mensual. Los cambios aplican desde el período siguiente."
        onClose={() => setModalAbierto(false)}
      >
        <CuotaSocialForm modo="crear" categorias={categorias} onSubmit={handleCrear} />
      </Modal>

      <div className="flex flex-wrap items-end gap-2">
        <Select
          id="filtroCategoria"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setPagina(1);
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
          }}
          className="min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </Select>

        <Input
          id="filtroPeriodo"
          type="month"
          placeholder="2026-10"
          value={periodoInput}
          onChange={(e) => setPeriodoInput(e.target.value)}
          className="min-w-[160px]"
        />
        <Button variant="secondary" onClick={aplicarPeriodo}>
          Filtrar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar las cuotas sociales.'}
        </div>
      ) : (
        <>
          <CuotaSocialTable
            cuotas={data?.items ?? []}
            onEditar={(cuota) => navigate(ROUTES.cuotaSocialEditar(cuota.id))}
          />

          {hayResultados && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {data?.total ?? 0} configuración(es)
                {isFetching ? ' · actualizando…' : ''}
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
