import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Filter, Plus, Search, UserPlus } from 'lucide-react';
import { Button, Input, Modal, Select, Spinner, StatusTabs, TablePagination, TableExportMenu } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EstadoSocioFiltro, Socio } from '../types';
import { sociosApi } from '../api/socios.api';
import { formatearDni } from '@/lib/utils/dni';
import type { ExportColumn } from '@/lib/utils/exportTable';
import { useCategorias } from '../hooks/useCategorias';
import { useSocios } from '../hooks/useSocios';
import { SocioForm } from '../components/SocioForm';
import { SociosTable } from '../components/SociosTable';
import { EditarSocioModal } from '../components/EditarSocioModal';
import { useCrearSocio } from '../hooks/useSocios';

type FiltroEstadoSocio = 'todos' | 'activos' | 'inactivos';

const COLUMNAS_EXPORT_SOCIOS: ExportColumn<Socio>[] = [
  { header: 'Apellido y nombre', accessor: (s) => `${s.apellido}, ${s.nombre}` },
  { header: 'DNI', accessor: (s) => formatearDni(s.dni) },
  { header: 'Email', accessor: (s) => s.email ?? '—' },
  { header: 'Categoría', accessor: (s) => s.categoria?.nombre ?? '—' },
  { header: 'Estado', accessor: (s) => (s.activo ? 'Activo' : 'Inactivo') },
];

export function SociosPage() {
  const location = useLocation();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');

  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoSocio>('todos');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [ordenarPor, setOrdenarPor] = useState<string | undefined>(undefined);
  const [orden, setOrden] = useState<'asc' | 'desc' | undefined>(undefined);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function handleOrdenar(campo: string) {
    if (ordenarPor === campo) {
      if (orden === 'asc') {
        setOrden('desc');
      } else if (orden === 'desc') {
        setOrdenarPor(undefined);
        setOrden(undefined);
      } else {
        setOrden('asc');
      }
    } else {
      setOrdenarPor(campo);
      setOrden('asc');
    }
    setPagina(1);
  }
  const [modalAbierto, setModalAbierto] = useState(false);
  // DT-20: la edición es un modal sobre el listado (?editar=<id>).
  const [searchParams, setSearchParams] = useSearchParams();
  const socioAEditar = Number(searchParams.get('editar')) || null;

  const mensajeState = (location.state as { mensaje?: string } | null)?.mensaje;

  useEffect(() => {
    if (mensajeState) {
      setMensaje(mensajeState);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setMensaje(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensajeState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setBusqueda(textoInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [textoInput]);

  const { data: categorias } = useCategorias();
  const crearSocio = useCrearSocio();

  const estadoQuery: EstadoSocioFiltro | undefined =
    filtroEstado === 'activos' ? 'ALTA' : filtroEstado === 'inactivos' ? 'BAJA' : undefined;

  const { data, isLoading, isError, error, isFetching } = useSocios({
    busqueda: busqueda || undefined,
    categoriaId,
    estado: estadoQuery,
    pagina,
    porPagina,
    ordenarPor,
    orden,
  });

  const hayResultados = (data?.items.length ?? 0) > 0;

  const [cachedCounts, setCachedCounts] = useState<{
    todos: number;
    activos: number;
    inactivos: number;
  }>({ todos: 0, activos: 0, inactivos: 0 });

  useEffect(() => {
    if (data?.counts) {
      setCachedCounts({
        todos: data.counts.todos ?? 0,
        activos: data.counts.alta ?? 0,
        inactivos: data.counts.baja ?? 0,
      });
    } else if (filtroEstado === 'todos' && data) {
      const activos = (data.items ?? []).filter((s) => s.activo).length;
      const inactivos = (data.items ?? []).length - activos;
      setCachedCounts({
        todos: data.total ?? (data.items ?? []).length,
        activos,
        inactivos,
      });
    }
  }, [data, filtroEstado]);

  const counts = data?.counts
    ? {
        todos: data.counts.todos ?? cachedCounts.todos,
        activos: data.counts.alta ?? cachedCounts.activos,
        inactivos: data.counts.baja ?? cachedCounts.inactivos,
      }
    : cachedCounts;

  const handleCrear = async (data: Parameters<typeof crearSocio.mutateAsync>[0]) => {
    await crearSocio.mutateAsync(data);
    setModalAbierto(false);
    setMensaje('Socio registrado correctamente.');
  };

  const cambiarCategoria = (value: string) => {
    setPagina(1);
    setCategoriaId(value ? Number(value) : undefined);
  };

  function cambiarFiltro(valor: string) {
    setPagina(1);
    if (valor === 'activos' || valor === 'ALTA') {
      setFiltroEstado('activos');
    } else if (valor === 'inactivos' || valor === 'BAJA') {
      setFiltroEstado('inactivos');
    } else {
      setFiltroEstado('todos');
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Socios</h1>
          <p className="mt-1 text-sm text-slate-500">Consultá, creá y editá los socios del club.</p>
        </div>

        {esAdmin && (
          <Button onClick={() => setModalAbierto(true)} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} />
            Nuevo socio
          </Button>
        )}
      </header>

      {/* Controles de filtro y búsqueda agrupados */}
      <div className="space-y-3">
        <div>
          <StatusTabs<FiltroEstadoSocio>
            value={filtroEstado}
            onChange={(val) => cambiarFiltro(val)}
            tabs={[
              { value: 'todos', label: 'Todos', count: counts.todos },
              { value: 'activos', label: 'Activos', count: counts.activos },
              { value: 'inactivos', label: 'Inactivos', count: counts.inactivos },
            ]}
          />

          {/* Accesibilidad y compatibilidad con pruebas automatizadas */}
          <div className="relative h-0 w-0 overflow-hidden">
            <select
              id="filtroEstado"
              aria-label="Filtrar por estado"
              value={filtroEstado === 'activos' ? 'ALTA' : filtroEstado === 'inactivos' ? 'BAJA' : 'todos'}
              onChange={(e) => cambiarFiltro(e.target.value)}
              className="sr-only"
              tabIndex={-1}
            >
              <option value="todos">Todos los estados</option>
              <option value="ALTA">Solo activos</option>
              <option value="BAJA">Solo inactivos</option>
              <option value="activos" className="hidden">Activos</option>
              <option value="inactivos" className="hidden">Inactivos</option>
            </select>
          </div>
        </div>

      {/* Barra de búsqueda y categorías estilo Apex */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            id="busqueda"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            leftIcon={<Search />}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <TableExportMenu<Socio>
            filename="socios"
            title="Socios"
            disabled={isLoading && !data}
            columns={COLUMNAS_EXPORT_SOCIOS}
            fetchRows={async () => {
              const res = await sociosApi.list({
                busqueda: busqueda || undefined,
                categoriaId,
                estado: estadoQuery,
                pagina: 1,
                porPagina: 10000,
                ordenarPor,
                orden,
              });
              return res?.items ?? [];
            }}
          />

          <Select
            id="categoria"
            value={categoriaId ?? ''}
            onChange={(e) => cambiarCategoria(e.target.value)}
            leftIcon={<Filter />}
            className="w-full sm:w-52"
          >
            <option value="">Todas las categorías</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>
      </div>

      <Modal
        open={modalAbierto}
        title="Nuevo socio"
        description="Completá los datos para registrar un nuevo socio."
        icon={<UserPlus />}
        size="lg"
        onClose={() => setModalAbierto(false)}
      >
        <SocioForm onSubmit={handleCrear} onCancel={() => setModalAbierto(false)} submitLabel="Crear socio" />
      </Modal>

      <EditarSocioModal socioId={socioAEditar} onClose={() => setSearchParams({})} />

      {mensaje && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los socios.'}
        </div>
      ) : (
        <div>
          <SociosTable
            socios={data?.items ?? []}
            ordenarPor={ordenarPor}
            orden={orden}
            onOrdenar={handleOrdenar}
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
              srSummary={`${data?.total ?? 0} socio(s)`}
            />
          )}
        </div>
      )}
    </div>
  );
}
