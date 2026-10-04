import { useState } from 'react';
import { Filter, Pencil, Plus, Wallet } from 'lucide-react';
import { Button, ConfirmDialog, Input, Modal, Select, Spinner } from '@/components/ui';
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
  const [categoriaDisciplinaId, setCategoriaDisciplinaId] = useState<number | undefined>(undefined);
  const [periodoInput, setPeriodoInput] = useState('');
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  // DT-05: tarifa a activar o desactivar (pide confirmación).
  const [aCambiarEstado, setACambiarEstado] = useState<ConfiguracionCuotaDeportiva | null>(null);

  const { data: disciplinas = [], isLoading: cargandoDisciplinas } = useDisciplinas();
  const categorias = disciplinas.find((d) => d.id === disciplinaId)?.categorias ?? [];

  const { data, isLoading, isError, error, isFetching } = useCuotas({
    disciplinaId,
    categoriaDisciplinaId,
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
    setModoFormulario('crear');
  }

  async function confirmarCambioDeEstado() {
    if (!aCambiarEstado) return;
    const activar = !aCambiarEstado.activo;
    try {
      await actualizarCuota.mutateAsync({
        id: aCambiarEstado.id,
        payload: { activo: activar },
        mensaje: activar ? 'Tarifa activada' : 'Tarifa desactivada',
      });
      setACambiarEstado(null);
    } catch {
      // El hook ya informa el error; el diálogo queda abierto para reintentar.
    }
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
        payload: { monto: values.monto, descuentoSocioPorcentaje: values.descuentoSocioPorcentaje },
      });
    } else {
      await configurarCuota.mutateAsync({
        disciplinaId: values.disciplinaId,
        ...(values.categoriaDisciplinaId ? { categoriaDisciplinaId: values.categoriaDisciplinaId } : {}),
        monto: values.monto,
        descuentoSocioPorcentaje: values.descuentoSocioPorcentaje,
        ...(values.periodoAplicacion ? { periodoAplicacion: values.periodoAplicacion } : {}),
      });
    }
    cerrarFormulario();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cuotas deportivas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tarifa mensual por disciplina, con tarifa propia opcional por categoría y descuento para
            socios. Los cambios rigen desde el mes siguiente.
          </p>
        </div>

        <Button onClick={abrirCreacion}>
          <Plus size={16} />
          Configurar tarifa
        </Button>
      </header>

      <Modal
        open={formularioVisible}
        title={modoFormulario === 'editar' ? 'Editar tarifa' : 'Nueva tarifa de cuota deportiva'}
        description={
          modoFormulario === 'editar'
            ? 'Actualizá el monto o el descuento para socios.'
            : 'Elegí la disciplina (y si querés una categoría), el monto mensual y el descuento para socios.'
        }
        icon={modoFormulario === 'editar' ? <Pencil /> : <Wallet />}
        size="md"
        onClose={cerrarFormulario}
      >
        {modoFormulario && (
          <CuotaForm
            key={cuotaEditando?.id ?? 'crear'}
            modo={modoFormulario}
            configuracionInicial={cuotaEditando}
            disciplinas={disciplinas}
            onSubmit={handleSubmit}
            onCancel={cerrarFormulario}
          />
        )}
      </Modal>

      <div className="flex flex-wrap items-end gap-2">
        <Select
          id="filtroDisciplina"
          value={disciplinaId ?? ''}
          onChange={(e) => {
            setPagina(1);
            setDisciplinaId(e.target.value ? Number(e.target.value) : undefined);
            setCategoriaDisciplinaId(undefined);
          }}
          leftIcon={<Filter />}
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
          value={categoriaDisciplinaId ?? ''}
          disabled={!disciplinaId}
          onChange={(e) => {
            setPagina(1);
            setCategoriaDisciplinaId(e.target.value ? Number(e.target.value) : undefined);
          }}
          leftIcon={<Filter />}
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
          aria-label="Filtrar por período"
          containerClassName="w-48"
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
          <CuotasTable
            cuotas={data?.items ?? []}
            onEditar={abrirEdicion}
            onCambiarEstado={setACambiarEstado}
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

      <ConfirmDialog
        open={aCambiarEstado !== null}
        variant={aCambiarEstado?.activo ? 'danger' : 'primary'}
        title={aCambiarEstado?.activo ? 'Desactivar tarifa' : 'Activar tarifa'}
        description={
          aCambiarEstado
            ? `${aCambiarEstado.disciplina.nombre}${
                aCambiarEstado.categoriaDisciplina ? ` · ${aCambiarEstado.categoriaDisciplina.nombre}` : ' · tarifa base'
              }, rige desde ${aCambiarEstado.periodoAplicacion.split('-').reverse().join('/')}.`
            : undefined
        }
        confirmLabel={aCambiarEstado?.activo ? 'Desactivar' : 'Activar'}
        loading={actualizarCuota.isPending}
        onConfirm={() => void confirmarCambioDeEstado()}
        onCancel={() => setACambiarEstado(null)}
      >
        {aCambiarEstado?.activo ? (
          <p className="text-sm text-slate-600">
            Mientras esté inactiva no se usa para calcular la cuota: rige la tarifa anterior del mismo
            alcance o, si es de una categoría, la de la disciplina. Si no hay ninguna, esos meses
            quedan sin tarifa.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Vuelve a usarse para calcular la cuota desde el período en que rige.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
