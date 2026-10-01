import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layers, Plus, Search } from 'lucide-react';
import { Button, Card, ConfirmDialog, Input, Modal, Spinner, StatusTabs } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { CategoriaForm } from '../components/CategoriaForm';
import { CategoriasTable } from '../components/CategoriasTable';
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useDesactivarCategoria,
  useReactivarCategoria,
} from '../hooks/useCategorias';
import type { CategoriaDisciplinaDetalle } from '../types';
import type { CategoriaFormValues } from '../schemas/categoria.schema';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';

/** US-48 a US-51: ABM de categorías de una disciplina y su documentación adicional. */
export function CategoriasDisciplinaPage() {
  const disciplinaId = Number(useParams<{ id: string }>().id);
  const { usuario } = useAuth();
  const puedeMutar = usuario?.roles.includes('ADMIN') ?? false;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<CategoriaDisciplinaDetalle | null>(null);
  const [aConfirmar, setAConfirmar] = useState<CategoriaDisciplinaDetalle | null>(null);

  const { data, isLoading, isError, error, isFetching } = useCategorias(disciplinaId, {
    busqueda: busqueda.trim() || undefined,
    estado: filtroEstado === 'todas' ? undefined : filtroEstado === 'activas' ? 'ACTIVA' : 'INACTIVA',
  });
  const crear = useCrearCategoria(disciplinaId);
  const actualizar = useActualizarCategoria(disciplinaId);
  const desactivar = useDesactivarCategoria(disciplinaId);
  const reactivar = useReactivarCategoria(disciplinaId);
  const guardando = crear.isPending || actualizar.isPending;
  const cambiandoEstado = desactivar.isPending || reactivar.isPending;

  const disciplina = data?.disciplina;
  const categorias = data?.items ?? [];
  const requerimientosDisciplina = disciplina?.requerimientosDoc ?? [];
  const restriccionesDisciplina = {
    genero: disciplina?.genero ?? null,
    edadMinima: disciplina?.edadMinima ?? null,
    edadMaxima: disciplina?.edadMaxima ?? null,
  };

  function abrir(categoria: CategoriaDisciplinaDetalle | null) {
    setSeleccionada(categoria);
    setModalAbierto(true);
  }

  function cerrar() {
    if (guardando) return;
    setModalAbierto(false);
    setSeleccionada(null);
  }

  async function guardar(values: CategoriaFormValues) {
    if (seleccionada) await actualizar.mutateAsync({ id: seleccionada.id, payload: values });
    else await crear.mutateAsync(values);
    setModalAbierto(false);
    setSeleccionada(null);
  }

  async function cambiarEstado() {
    if (!aConfirmar) return;
    if (aConfirmar.activo) await desactivar.mutateAsync(aConfirmar.id);
    else await reactivar.mutateAsync(aConfirmar.id);
    setAConfirmar(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to={ROUTES.disciplinas} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft size={14} /> Disciplinas
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Categorías{disciplina ? ` de ${disciplina.nombre}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Agrupá a los participantes por nivel o edad y definí la documentación adicional de cada categoría.</p>
        </div>
        {puedeMutar && (
          <Button onClick={() => abrir(null)} disabled={!disciplina?.activo} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} /> Nueva categoría
          </Button>
        )}
      </header>

      {disciplina && !disciplina.activo && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">La disciplina está inactiva: no se pueden agregar categorías.</Card>
      )}

      <Modal open={modalAbierto} title={seleccionada ? 'Editar categoría' : 'Nueva categoría'} description={disciplina ? `Disciplina: ${disciplina.nombre}` : undefined} onClose={cerrar} className="max-w-2xl">
        <CategoriaForm categoria={seleccionada} requerimientosDisciplina={requerimientosDisciplina} restriccionesDisciplina={restriccionesDisciplina} guardando={guardando} onSubmit={guardar} onCancel={cerrar} />
      </Modal>

      <ConfirmDialog
        open={aConfirmar !== null}
        variant={aConfirmar?.activo ? 'danger' : 'success'}
        title={aConfirmar?.activo ? 'Dar de baja categoría' : 'Reactivar categoría'}
        description={aConfirmar?.activo ? 'La categoría dejará de ofrecerse para nuevas inscripciones. Se conservan las inscripciones históricas.' : 'La categoría volverá a estar disponible para inscripción.'}
        confirmLabel={aConfirmar?.activo ? 'Dar de baja' : 'Reactivar'}
        loading={cambiandoEstado}
        onConfirm={() => void cambiarEstado()}
        onCancel={() => setAConfirmar(null)}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs<FiltroEstado>
          value={filtroEstado}
          onChange={setFiltroEstado}
          aria-label="Filtrar por estado"
          tabs={[
            { value: 'todas', label: 'Todas' },
            { value: 'activas', label: 'Activas' },
            { value: 'inactivas', label: 'Inactivas' },
          ]}
        />
        <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar categoría" leftIcon={<Search />} containerClassName="sm:min-w-64" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error instanceof Error ? error.message : 'No se pudieron cargar las categorías.'}</Card>
      ) : categorias.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500"><Layers className="mx-auto mb-2 text-slate-300" size={28} />No se encontraron resultados</Card>
      ) : (
        <>
          <CategoriasTable categorias={categorias} requerimientosDisciplina={requerimientosDisciplina} restriccionesDisciplina={restriccionesDisciplina} puedeMutar={puedeMutar} accionesDeshabilitadas={cambiandoEstado} onEditar={abrir} onCambiarEstado={setAConfirmar} />
          <p className="text-sm text-slate-500">{categorias.length} categoría(s){isFetching ? ' · actualizando…' : ''}</p>
        </>
      )}
    </div>
  );
}
