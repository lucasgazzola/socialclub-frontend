import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button, Input, Select, Spinner } from '@/components/ui';
import type { EstadoSocioFiltro } from '../types';
import { useSocios } from '../hooks/useSocios';
import { useCategorias } from '../hooks/useCategorias';
import { SociosTable } from '../components/SociosTable';

const POR_PAGINA = 10;

/**
 * Página de búsqueda y filtrado de socios (US-15).
 * Toda la búsqueda, el filtrado por categoría/estado y la paginación
 * se resuelven en el backend; el frontend solo mantiene el estado de los filtros.
 */
export function SociosPage() {
  const location = useLocation();
  const [busqueda, setBusqueda] = useState('');
  const [textoInput, setTextoInput] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoSocioFiltro | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const mensajeState = (location.state as { mensaje?: string } | null)?.mensaje;

  useEffect(() => {
    if (mensajeState) {
      setMensaje(mensajeState);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setMensaje(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensajeState]);

  const { data: categorias } = useCategorias();

  const { data, isLoading, isError, error, isFetching } = useSocios({
    busqueda: busqueda || undefined,
    categoriaId,
    estado,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    setBusqueda(textoInput.trim());
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Socios</h1>
          <p className="mt-1 text-sm text-slate-500">Buscá y filtrá los socios del club.</p>
        </div>

        <div className="flex w-full max-w-3xl flex-wrap items-end gap-2">
          <form onSubmit={buscar} className="flex flex-1 min-w-[220px] items-end gap-2">
            <Input
              id="busqueda"
              placeholder="Buscar por nombre, apellido o DNI"
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search size={16} />
              Buscar
            </Button>
          </form>

          <Select
            id="categoria"
            value={categoriaId ?? ''}
            onChange={(e) => cambiarCategoria(e.target.value)}
            className="min-w-[160px]"
          >
            <option value="">Todas las categorías</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>

          <Select
            id="estado"
            value={estado ?? ''}
            onChange={(e) => cambiarEstado(e.target.value)}
            className="min-w-[140px]"
          >
            <option value="">Todos los estados</option>
            <option value="ALTA">Alta</option>
            <option value="BAJA">Baja</option>
          </Select>
        </div>
      </header>

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
