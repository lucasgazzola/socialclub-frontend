import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, Input, Select, Spinner } from '@/components/ui';
import { useCategories } from '@/features/members/hooks/useCategories';
import { FeeForm } from '../components/FeeForm';
import { FeesTable } from '../components/FeesTable';
import { useUpdateFee } from '../hooks/useUpdateFee';
import { useConfigureFee } from '../hooks/useConfigureFee';
import { useFees } from '../hooks/useFees';
import { useDisciplines } from '../hooks/useDisciplines';
import type { FeeFormValues } from '../schemas';
import type { SportsFeeConfig } from '../types';

const POR_PAGINA = 10;

/**
 * Administración de cuotas deportivas por disciplina y categoría.
 * Solo ADMIN: configura (crea/actualiza) y edita el monto; los cambios aplican
 * desde el período siguiente (regla cubierta por el backend).
 */
export function FeesPage() {
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar' | null>(null);
  const [cuotaEditando, setCuotaEditando] = useState<SportsFeeConfig | null>(null);

  const [disciplineId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoriaId] = useState<number | undefined>(undefined);
  const [periodoInput, setPeriodoInput] = useState('');
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: disciplinas = [], isLoading: cargandoDisciplinas } = useDisciplines();
  const { data: categorias = [] } = useCategories();

  const { data, isLoading, isError, error, isFetching } = useFees({
    disciplineId,
    categoryId,
    appliedPeriod: periodo || undefined,
    page,
    perPage: POR_PAGINA,
  });

  const configurarCuota = useConfigureFee();
  const actualizarCuota = useUpdateFee();

  const formularioVisible = modoFormulario !== null;
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  function abrirCreacion() {
    setCuotaEditando(null);
    setModoFormulario((actual) => (actual === 'crear' ? null : 'crear'));
  }

  function abrirEdicion(cuota: SportsFeeConfig) {
    setCuotaEditando(cuota);
    setModoFormulario('editar');
  }

  function cerrarFormulario() {
    setModoFormulario(null);
    setCuotaEditando(null);
  }

  function aplicarPeriodo() {
    setPage(1);
    setPeriodo(periodoInput.trim() || undefined);
  }

  async function handleSubmit(values: FeeFormValues) {
    if (modoFormulario === 'editar' && cuotaEditando) {
      await actualizarCuota.mutateAsync({
        id: cuotaEditando.id,
        payload: { amount: values.amount },
      });
    } else {
      await configurarCuota.mutateAsync({
        disciplineId: values.disciplineId,
        categoryId: values.categoryId,
        amount: values.amount,
        ...(values.appliedPeriod ? { appliedPeriod: values.appliedPeriod } : {}),
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

          <FeeForm
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
          value={disciplineId ?? ''}
          onChange={(e) => {
            setPage(1);
            setDisciplinaId(e.target.value ? Number(e.target.value) : undefined);
          }}
          className="min-w-[180px]"
        >
          <option value="">Todas las disciplinas</option>
          {disciplinas.map((disciplina) => (
            <option key={disciplina.id} value={disciplina.id}>
              {disciplina.name}
            </option>
          ))}
        </Select>

        <Select
          id="filtroCategoria"
          value={categoryId ?? ''}
          onChange={(e) => {
            setPage(1);
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
          }}
          className="min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.name}
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
          <FeesTable cuotas={data?.items ?? []} onEditar={abrirEdicion} />

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
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {page} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
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
