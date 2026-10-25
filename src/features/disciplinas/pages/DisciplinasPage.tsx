import { useState } from 'react';
import { Dumbbell, Plus, Search } from 'lucide-react';
import { Button, Card, ConfirmDialog, Input, Modal, Spinner, StatusTabs, TablePagination, TableExportMenu } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DisciplinaForm } from '../components/DisciplinaForm';
import { DisciplinasTable } from '../components/DisciplinasTable';
import {
  useActualizarDisciplina,
  useCrearDisciplina,
  useDesactivarDisciplina,
  useDisciplinas,
  useReactivarDisciplina,
} from '../hooks/useDisciplinas';
import { listarDisciplinas } from '../api/disciplina.api';
import { GENERO_DISCIPLINA_LABELS, type Disciplina } from '../types';
import type { ExportColumn } from '@/lib/utils/exportTable';
import type { DisciplinaFormValues } from '../schemas/disciplina.schema';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';

const COLUMNAS_EXPORT_DISCIPLINAS: ExportColumn<Disciplina>[] = [
  { header: 'Nombre', accessor: (d) => d.nombre },
  { header: 'Descripción', accessor: (d) => d.descripcion || '—' },
  { header: 'Género', accessor: (d) => (d.genero ? GENERO_DISCIPLINA_LABELS[d.genero] : 'Sin restricción') },
  {
    header: 'Edad',
    accessor: (d) =>
      d.edadMinima !== null && d.edadMinima !== undefined
        ? `${d.edadMinima}–${d.edadMaxima ?? '∞'}`
        : d.edadMaxima !== null && d.edadMaxima !== undefined
          ? `hasta ${d.edadMaxima}`
          : 'Sin límite',
  },
  {
    header: 'Documentación',
    accessor: (d) => (d.solicitaDocumentacion ? `${d.requerimientosDoc.length} tipo(s)` : 'No requiere'),
  },
  { header: 'Estado', accessor: (d) => (d.activo ? 'Activa' : 'Inactiva') },
];

export function DisciplinasPage() {
  const { usuario } = useAuth();
  const puedeMutar = usuario?.roles.includes('ADMIN') ?? false;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<Disciplina | null>(null);
  const [disciplinaAConfirmar, setDisciplinaAConfirmar] = useState<Disciplina | null>(null);

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const { data, isLoading, isError, error, isFetching } = useDisciplinas({
    busqueda: busqueda.trim() || undefined,
    estado: filtroEstado === 'todas' ? undefined : filtroEstado === 'activas' ? 'ACTIVA' : 'INACTIVA',
    pagina,
    porPagina,
  });
  const crear = useCrearDisciplina();
  const actualizar = useActualizarDisciplina();
  const desactivar = useDesactivarDisciplina();
  const reactivar = useReactivarDisciplina();
  const cambiandoEstado = desactivar.isPending || reactivar.isPending;

  const disciplinas = data?.items ?? [];

  function cambiarFiltroEstado(valor: FiltroEstado) {
    setFiltroEstado(valor);
    setPagina(1);
  }

  function abrirCreacion() {
    setDisciplinaSeleccionada(null);
    setModalAbierto(true);
  }

  function abrirEdicion(disciplina: Disciplina) {
    setDisciplinaSeleccionada(disciplina);
    setModalAbierto(true);
  }

  async function guardar(values: DisciplinaFormValues) {
    if (disciplinaSeleccionada) {
      await actualizar.mutateAsync({ id: disciplinaSeleccionada.id, payload: values });
    } else {
      await crear.mutateAsync(values);
    }
    setModalAbierto(false);
    setDisciplinaSeleccionada(null);
  }

  async function cambiarEstado() {
    if (!disciplinaAConfirmar) return;
    if (disciplinaAConfirmar.activo) await desactivar.mutateAsync(disciplinaAConfirmar.id);
    else await reactivar.mutateAsync(disciplinaAConfirmar.id);
    setDisciplinaAConfirmar(null);
  }

  const guardando = crear.isPending || actualizar.isPending;
  const tituloConfirmacion = disciplinaAConfirmar?.activo ? 'Desactivar disciplina' : 'Reactivar disciplina';

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Disciplinas</h1>
          <p className="mt-1 text-sm text-slate-500">Administrá las actividades, restricciones y documentación requerida.</p>
        </div>
        {puedeMutar && <Button onClick={abrirCreacion} className="self-start shadow-xs sm:self-auto"><Plus size={16} /> Nueva disciplina</Button>}
      </header>

      <Modal
        open={modalAbierto}
        title={disciplinaSeleccionada ? 'Editar disciplina' : 'Nueva disciplina'}
        description="Completá los datos de la actividad y sus requisitos."
        onClose={() => { if (!guardando) { setModalAbierto(false); setDisciplinaSeleccionada(null); } }}
        icon={<Dumbbell />}
        size="lg"
      >
        <DisciplinaForm disciplina={disciplinaSeleccionada} guardando={guardando} onSubmit={guardar} onCancel={() => { setModalAbierto(false); setDisciplinaSeleccionada(null); }} />
      </Modal>

      <ConfirmDialog
        open={disciplinaAConfirmar !== null}
        variant={disciplinaAConfirmar?.activo ? 'danger' : 'success'}
        title={tituloConfirmacion}
        description={disciplinaAConfirmar?.activo ? 'La disciplina dejará de aparecer entre las actividades activas, sin borrar el historial de inscripciones.' : 'La disciplina volverá a estar disponible para nuevas operaciones.'}
        confirmLabel={disciplinaAConfirmar?.activo ? 'Desactivar' : 'Reactivar'}
        loading={cambiandoEstado}
        onConfirm={() => void cambiarEstado()}
        onCancel={() => setDisciplinaAConfirmar(null)}
      />

      <div className="space-y-3">
        <div>
          <StatusTabs<FiltroEstado>
            value={filtroEstado}
            onChange={cambiarFiltroEstado}
            tabs={[
              { value: 'todas', label: 'Todos', count: data?.conteos.todas ?? 0 },
              { value: 'activas', label: 'Activos', count: data?.conteos.activas ?? 0 },
              { value: 'inactivas', label: 'Inactivos', count: data?.conteos.inactivas ?? 0 },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input value={busqueda} onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }} placeholder="Buscar Disciplina" leftIcon={<Search />} />
          </div>
          <div className="flex items-center gap-2.5">
            <TableExportMenu<Disciplina>
              filename="disciplinas"
              title="Disciplinas"
              disabled={isLoading && !data}
              columns={COLUMNAS_EXPORT_DISCIPLINAS}
              fetchRows={async () => {
                const res = await listarDisciplinas({
                  busqueda: busqueda.trim() || undefined,
                  estado: filtroEstado === 'todas' ? undefined : filtroEstado === 'activas' ? 'ACTIVA' : 'INACTIVA',
                  pagina: 1,
                  porPagina: 100,
                });
                return res?.items ?? [];
              }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error instanceof Error ? error.message : 'No se pudieron cargar las disciplinas.'}</Card>
      ) : disciplinas.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500"><Dumbbell className="mx-auto mb-2 text-slate-300" size={28} />No hay disciplinas que coincidan con los filtros.</Card>
      ) : (
        <div>
          <DisciplinasTable disciplinas={disciplinas} puedeMutar={puedeMutar} accionesDeshabilitadas={cambiandoEstado} onEditar={abrirEdicion} onCambiarEstado={setDisciplinaAConfirmar} />
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
            srSummary={`${data?.total ?? 0} disciplina(s)`}
          />
        </div>
      )}
    </div>
  );
}
