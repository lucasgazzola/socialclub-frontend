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

export function SociosPage() {
  const location = useLocation();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN');

  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoSocioFiltro | undefined>(undefined);
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

  const { data, isLoading, isError, error, isFetching } = useSocios({
    busqueda: busqueda || undefined,
    categoriaId,
    estado,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  const handleCrear = async (data: Parameters<typeof crearSocio.mutateAsync>[0]) => {
    await crearSocio.mutateAsync(data);
    setModalAbierto(false);
    setMensaje('Socio registrado correctamente.');
  };

  const cambiarCategoria = (value: string) => {
    setPagina(1);
    setCategoriaId(value ? Number(value) : undefined);
  };

  const cambiarEstado = (value: string) => {
    setPagina(1);
    setEstado(value ? (value as EstadoSocioFiltro) : undefined);
  };

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
        <StatusTabs<string>
          value={estado ?? 'TODOS'}
          onChange={(val) => cambiarEstado(val === 'TODOS' ? '' : val)}
          tabs={[
            { value: 'TODOS', label: 'Todos', count: data?.counts?.todos },
            { value: 'ALTA', label: 'Activos', count: data?.counts?.alta },
            { value: 'BAJA', label: 'Inactivos', count: data?.counts?.baja },
          ]}
        />

        {/* Accesibilidad y compatibilidad con pruebas */}
        <select
          id="estado"
          aria-label="Filtrar por estado"
          value={estado ?? ''}
          onChange={(e) => cambiarEstado(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        >
          <option value="">Todos los estados</option>
          <option value="ALTA">Alta</option>
          <option value="BAJA">Baja</option>
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