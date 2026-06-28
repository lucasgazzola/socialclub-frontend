import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { useSocios } from '../hooks/useSocios';
import { SociosTable } from '../components/SociosTable';

const POR_PAGINA = 10;

/**
 * Página de consulta de socios (US-15). Sirve de plantilla del patrón de las
 * features: estado local de UI + hook de datos (react-query) + componentes de
 * presentación. El equipo puede replicar esta estructura para Usuarios, Cuotas,
 * Eventos, etc.
 */
export function SociosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [textoInput, setTextoInput] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useSocios({
    busqueda: busqueda || undefined,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    setBusqueda(textoInput.trim());
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Socios</h1>
          <p className="mt-1 text-sm text-slate-500">Consultá y filtrá los socios del club.</p>
        </div>
        <form onSubmit={buscar} className="flex w-full max-w-sm items-end gap-2">
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
      </header>

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
        </>
      )}
    </div>
  );
}
