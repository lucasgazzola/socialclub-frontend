import { useState } from 'react';
import { Dumbbell, Plus, Search } from 'lucide-react';
import { Button, Card, ConfirmDialog, Input, Modal, Spinner, StatusTabs } from '@/components/ui';
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
import type { Disciplina } from '../types';
import type { DisciplinaFormValues } from '../schemas/disciplina.schema';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';

export function DisciplinasPage() {
  const { usuario } = useAuth();
  const puedeMutar = usuario?.roles.includes('ADMIN') ?? false;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState<Disciplina | null>(null);
  const [disciplinaAConfirmar, setDisciplinaAConfirmar] = useState<Disciplina | null>(null);

  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
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
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;

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
    <div className="space-y-6">
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <StatusTabs<FiltroEstado>
            value={filtroEstado}
              onChange={cambiarFiltroEstado}
            tabs={[
              { value: 'todas', label: 'Todos', count: data?.conteos.todas ?? 0 },
              { value: 'activas', label: 'Activos', count: data?.conteos.activas ?? 0 },
              { value: 'inactivas', label: 'Inactivos', count: data?.conteos.inactivas ?? 0 },
            ]}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={busqueda} onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1); }} placeholder="Buscar Disciplina" leftIcon={<Search />} containerClassName="sm:min-w-64" />
          </div>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div> : isError ? <Card className="border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error instanceof Error ? error.message : 'No se pudieron cargar las disciplinas.'}</Card> : disciplinas.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500"><Dumbbell className="mx-auto mb-2 text-slate-300" size={28} />No hay disciplinas que coincidan con los filtros.</Card> : <>
        <DisciplinasTable disciplinas={disciplinas} puedeMutar={puedeMutar} accionesDeshabilitadas={cambiandoEstado} onEditar={abrirEdicion} onCambiarEstado={setDisciplinaAConfirmar} />
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{data?.total ?? 0} disciplina(s){isFetching ? ' · actualizando…' : ''}</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={pagina <= 1 || isFetching} onClick={() => setPagina((actual) => actual - 1)}>Anterior</Button>
            <span>Página {pagina} de {totalPaginas}</span>
            <Button variant="secondary" size="sm" disabled={pagina >= totalPaginas || isFetching} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</Button>
          </div>
        </div>
      </>}
    </div>
  );
}

