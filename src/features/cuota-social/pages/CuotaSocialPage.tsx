import { useState } from 'react';
import { Filter, Plus, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, Modal, Select, Spinner, TablePagination, TableExportMenu } from '@/components/ui';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { cuotaSocialApi } from '../api/cuota-social.api';
import type { ConfiguracionCuotaSocial } from '../types';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaSocialForm } from '../components/CuotaSocialForm';
import { CuotaSocialTable } from '../components/CuotaSocialTable';
import { EditarCuotaSocialModal } from '../components/EditarCuotaSocialModal';
import { useConfigurarCuotaSocial } from '../hooks/useConfigurarCuotaSocial';
import { useCuotaSocial } from '../hooks/useCuotaSocial';
import type { CuotaSocialFormValues } from '../schemas';

const COLUMNAS_EXPORT_CUOTA_SOCIAL: ExportColumn<ConfiguracionCuotaSocial>[] = [
  { header: 'Categoría', accessor: (c) => c.categoria.nombre },
  { header: 'Período', accessor: (c) => c.periodoAplicacion },
  { header: 'Monto', accessor: (c) => c.monto },
  { header: 'Estado', accessor: (c) => (c.activo ? 'Activo' : 'Inactivo') },
];

export function CuotaSocialPage() {
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [periodoInput, setPeriodoInput] = useState('');
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [modalAbierto, setModalAbierto] = useState(false);
  // DT-20: la edición es un modal sobre el listado (?editar=<id>).
  const [searchParams, setSearchParams] = useSearchParams();
  const cuotaAEditar = Number(searchParams.get('editar')) || null;

  const { data: categorias = [] } = useCategorias();
  const configurarCuota = useConfigurarCuotaSocial();

  const { data, isLoading, isError, error, isFetching } = useCuotaSocial({
    categoriaId,
    periodoAplicacion: periodo || undefined,
    pagina,
    porPagina,
  });

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
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cuota social</h1>
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
        icon={<Wallet />}
        size="md"
        onClose={() => setModalAbierto(false)}
      >
        <CuotaSocialForm modo="crear" categorias={categorias} onSubmit={handleCrear} onCancel={() => setModalAbierto(false)} />
      </Modal>

      <EditarCuotaSocialModal cuotaId={cuotaAEditar} onClose={() => setSearchParams({})} />

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            id="filtroCategoria"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setPagina(1);
              setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
            }}
            leftIcon={<Filter />}
            className="w-full sm:w-48"
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
            containerClassName="w-full sm:w-48"
          />
          <Button variant="secondary" onClick={aplicarPeriodo} className="w-full sm:w-auto">
            Filtrar
          </Button>
        </div>

        <TableExportMenu<ConfiguracionCuotaSocial>
          filename="cuota-social"
          title="Cuota social"
          disabled={isLoading && !data}
          columns={COLUMNAS_EXPORT_CUOTA_SOCIAL}
          fetchRows={async () => {
            const res = await cuotaSocialApi.list({
              categoriaId,
              periodoAplicacion: periodo || undefined,
              pagina: 1,
              porPagina: 100,
            });
            return res?.items ?? [];
          }}
        />
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
        <div>
          <CuotaSocialTable
            cuotas={data?.items ?? []}
            onEditar={(cuota) => setSearchParams({ editar: String(cuota.id) })}
          />

          {hayResultados && (
            <TablePagination
              pagina={pagina}
              porPagina={porPagina}
              total={data?.total ?? 0}
              isFetching={isFetching}
              onChangePagina={setPagina}
              onChangePorPagina={(nuevo) => {
                setPorPagina(nuevo);
                setPagina(1);
              }}
              srSummary={`${data?.total ?? 0} configuración(es)`}
            />
          )}
        </div>
      )}
    </div>
  );
}
