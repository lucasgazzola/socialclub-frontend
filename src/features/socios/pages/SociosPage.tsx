import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Filter, Plus, Search, UserPlus } from 'lucide-react';
import { Button, Input, Modal, Select, Spinner, StatusTabs } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EstadoSocioFiltro } from '../types';
import { useCategorias } from '../hooks/useCategorias';
import { useSocios } from '../hooks/useSocios';
import { SocioForm } from '../components/SocioForm';
import { SociosTable } from '../components/SociosTable';
import { EditarSocioModal } from '../components/EditarSocioModal';
import { useCrearSocio } from '../hooks/useSocios';

const POR_PAGINA = 10;

type FiltroEstadoSocio = 'todos' | 'activos' | 'inactivos';

export function SociosPage() {
  const location = useLocation();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');

  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoSocio>('todos');
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState<string | null>(null);
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
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
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
    <div className="space-y-6">
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
        <>
          <SociosTable socios={data?.items ?? []} />

          {hayResultados && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {data?.total ?? 0} socio(s){isFetching ? ' · actualizando…' : ''}
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