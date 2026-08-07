import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, Input, Select, Spinner } from '@/components/ui';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { CuotaForm } from '../components/CuotaForm';
import { CuotasTable } from '../components/CuotasTable';
import { useActualizarCuota } from '../hooks/useActualizarCuota';
import { useConfigurarCuota } from '../hooks/useConfigurarCuota';
import { useCuotas } from '../hooks/useCuotas';
import { useDisciplinas } from '../hooks/useDisciplinas';
import type { CuotaFormValues } from '../schemas';
import type { ConfiguracionCuotaDeportiva } from '../types';

const POR_PAGINA = 10;

/**
 * Administración de cuotas deportivas por disciplina y categoría.
 * Solo ADMIN: configura (crea/actualiza) y edita el monto; los cambios aplican
 * desde el período siguiente (regla cubierta por el backend).
 */
export function CuotasPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar' | null>(null);
  const [cuotaEditando, setCuotaEditando] = useState<ConfiguracionCuotaDeportiva | null>(null);

  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [periodoInput, setPeriodoInput] = useState('');
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [pagina, setPagina] = useState(1);

  const { data: disciplinas = [], isLoading: cargandoDisciplinas } = useDisciplinas();
  const { data: categorias = [] } = useCategorias();

  const { data, isLoading, isError, error, isFetching } = useCuotas({
    disciplinaId,
    categoriaId,
    periodoAplicacion: periodo || undefined,
    pagina,
    porPagina: POR_PAGINA,
  });

  const configurarCuota = useConfigurarCuota();
  const actualizarCuota = useActualizarCuota();

  const formularioVisible = modoFormulario !== null;
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  function abrirCreacion() {
    setCuotaEditando(null);
    setModoFormulario((actual) => (actual === 'crear' ? null : 'crear'));
  }

  function abrirEdicion(cuota: ConfiguracionCuotaDeportiva) {
    setCuotaEditando(cuota);
    setModoFormulario('editar');
  }

  function cerrarFormulario() {
    setModoFormulario(null);
    setCuotaEditando(null);
  }

  function aplicarPeriodo() {
    setPagina(1);
    setPeriodo(periodoInput.trim() || undefined);
  }

  async function handleSubmit(values: CuotaFormValues) {
    if (modoFormulario === 'editar' && cuotaEditando) {
      await actualizarCuota.mutateAsync({
        id: cuotaEditando.id,
        payload: { monto: values.monto },
      });
    } else {
      await configurarCuota.mutateAsync({
        disciplinaId: values.disciplinaId,
        categoriaId: values.categoriaId,
        monto: values.monto,
        ...(values.periodoAplicacion ? { periodoAplicacion: values.periodoAplicacion } : {}),
      });
    }
    cerrarFormulario();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cuotas deportivas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configurá el monto mensual de la cuota por disciplina y categoría. Los cambios aplican
            desde el período siguiente.
          </p>
        </div>

        <Button onClick={abrirCreacion}>
          <Plus size={16} />
          {formularioVisible && modoFormulario === 'crear' ? 'Cerrar formulario' : 'Configurar cuota'}
        </Button>
      </header>

      {formularioVisible && (
        <Card className="p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {modoFormulario === 'editar' ? 'Editar cuota deportiva' : 'Nueva cuota deportiva'}
              </h2>
              <p className="text-sm text-slate-500">
                {modoFormulario === 'editar'
                  ? 'Actualizá el monto de la configuración existente.'
                  : 'Elegí disciplina, categoría y el monto mensual.'}
              </p>
            </div>
            <Button variant="ghost" onClick={cerrarFormulario}>
              Cancelar
            </Button>
          </div>

          <CuotaForm
            modo={modoFormulario}
            configuracionInicial={cuotaEditando}
            disciplinas={disciplinas}
            categorias={categorias}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Select
          id="filtroDisciplina"
          value={disciplinaId ?? ''}
          onChange={(e) => {
            setPagina(1);
            setDisciplinaId(e.target.value ? Number(e.target.value) : undefined);
          }}
          className="min-w-[180px]"
        >
          <option value="">Todas las disciplinas</option>
          {disciplinas.map((disciplina) => (
            <option key={disciplina.id} value={disciplina.id}>
              {disciplina.nombre}
            </option>
          ))}
        </Select>

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
          placeholder="2026-09"
          value={periodoInput}
          onChange={(e) => setPeriodoInput(e.target.value)}
          className="min-w-[160px]"
        />
        <Button variant="secondary" onClick={aplicarPeriodo}>
          Filtrar
        </Button>
      </div>

      {isLoading || cargandoDisciplinas ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar las cuotas.'}
        </div>
      ) : (
        <>
          <CuotasTable cuotas={data?.items ?? []} onEditar={abrirEdicion} />

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
