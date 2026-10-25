import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, Plus, Search } from 'lucide-react';
import { Button, Card, ConfirmDialog, Input, Modal, Spinner, StatusTabs, TablePagination, TableExportMenu } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CategoriaForm } from '../components/CategoriaForm';
import { CategoriasTable } from '../components/CategoriasTable';
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useDesactivarCategoria,
  useReactivarCategoria,
} from '../hooks/useCategorias';
import { listarCategorias } from '../api/categoria.api';
import {
  GENERO_DISCIPLINA_LABELS,
  describirEdad,
  etiquetaTipoDocumento,
  restriccionesEfectivas,
  type CategoriaDisciplinaDetalle,
} from '../types';
import type { ExportColumn } from '@/lib/utils/exportTable';
import type { CategoriaFormValues } from '../schemas/categoria.schema';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';
const POR_PAGINA_DEFAULT = 10;

/** US-48 a US-51: ABM de categorías de una disciplina y su documentación adicional. */
export function CategoriasDisciplinaPage() {
  const disciplinaId = Number(useParams<{ id: string }>().id);
  const { usuario } = useAuth();
  const puedeMutar = usuario?.roles.includes('ADMIN') ?? false;
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA_DEFAULT);
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
  const total = data?.total ?? categorias.length;
  const yaVienePaginadoDelBackend = Boolean(data?.pagina && data?.porPagina);
  const categoriasPaginadas = yaVienePaginadoDelBackend
    ? categorias
    : categorias.slice((pagina - 1) * porPagina, pagina * porPagina);

  const activasEnItems = categorias.filter((c) => c.activo).length;
  const inactivasEnItems = categorias.length - activasEnItems;
  const conteos = data?.conteos ?? {
    todas: total,
    activas: filtroEstado === 'activas' ? total : filtroEstado === 'inactivas' ? 0 : activasEnItems,
    inactivas: filtroEstado === 'inactivas' ? total : filtroEstado === 'activas' ? 0 : inactivasEnItems,
  };
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
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
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

      <Modal open={modalAbierto} title={seleccionada ? 'Editar categoría' : 'Nueva categoría'} description={disciplina ? `Disciplina: ${disciplina.nombre}` : undefined} onClose={cerrar} icon={<Layers />} size="lg">
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

      <div className="space-y-3">
        <div>
          <StatusTabs<FiltroEstado>
            value={filtroEstado}
            onChange={(estado) => {
              setFiltroEstado(estado);
              setPagina(1);
            }}
            aria-label="Filtrar por estado"
            tabs={[
              { value: 'todas', label: 'Todas', count: conteos.todas },
              { value: 'activas', label: 'Activas', count: conteos.activas },
              { value: 'inactivas', label: 'Inactivas', count: conteos.inactivas },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
              placeholder="Buscar categoría"
              leftIcon={<Search />}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <TableExportMenu<CategoriaDisciplinaDetalle>
              filename={`categorias-${disciplina?.nombre?.toLowerCase().replace(/\s+/g, '-') ?? disciplinaId}`}
              title={`Categorías${disciplina ? ` de ${disciplina.nombre}` : ''}`}
              disabled={isLoading && !data}
              columns={[
                { header: 'Nombre', accessor: (c) => c.nombre },
                {
                  header: 'Restricciones',
                  accessor: (c) => {
                    const efectivas = restriccionesEfectivas(restriccionesDisciplina, c);
                    return `${efectivas.genero ? GENERO_DISCIPLINA_LABELS[efectivas.genero] : 'Cualquier género'} · ${describirEdad(efectivas)}`;
                  },
                },
                {
                  header: 'Documentación exigida',
                  accessor: (c) => {
                    const docs = [
                      ...requerimientosDisciplina.map((r) => etiquetaTipoDocumento(r.tipoDocumento)),
                      ...c.requerimientosDoc.map((r) => etiquetaTipoDocumento(r.tipoDocumento)),
                    ];
                    return docs.length === 0 ? 'No requiere' : docs.join(', ');
                  },
                },
                { header: 'Inscriptos', accessor: (c) => c._count.inscripciones },
                { header: 'Estado', accessor: (c) => (c.activo ? 'Activa' : 'Inactiva') },
              ] satisfies ExportColumn<CategoriaDisciplinaDetalle>[]}
              fetchRows={async () => {
                const res = await listarCategorias(disciplinaId, {
                  busqueda: busqueda.trim() || undefined,
                  estado: filtroEstado === 'todas' ? undefined : filtroEstado === 'activas' ? 'ACTIVA' : 'INACTIVA',
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
        <Card className="border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error instanceof Error ? error.message : 'No se pudieron cargar las categorías.'}</Card>
      ) : categorias.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500"><Layers className="mx-auto mb-2 text-slate-300" size={28} />No se encontraron resultados</Card>
      ) : (
        <div>
          <CategoriasTable categorias={categoriasPaginadas} requerimientosDisciplina={requerimientosDisciplina} restriccionesDisciplina={restriccionesDisciplina} puedeMutar={puedeMutar} accionesDeshabilitadas={cambiandoEstado} onEditar={abrir} onCambiarEstado={setAConfirmar} />
          <TablePagination
            pagina={pagina}
            porPagina={porPagina}
            total={total}
            isFetching={isFetching}
            onChangePagina={setPagina}
            onChangePorPagina={(nuevoPorPagina) => {
              setPorPagina(nuevoPorPagina);
              setPagina(1);
            }}
            srSummary={`${total} categoría(s)`}
          />
        </div>
      )}
    </div>
  );
}
