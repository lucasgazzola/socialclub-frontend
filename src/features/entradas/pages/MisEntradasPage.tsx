import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarSearch, History, Search, Ticket } from 'lucide-react';
import { Input, StatusTabs, TablePagination } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useMisEntradas } from '../hooks/useEntradas';
import { EntradasEventoCard } from '../components/EntradasEventoCard';
import { agruparPorEvento } from '../utils/estadoEntrada';

type Pestania = 'PROXIMAS' | 'HISTORIAL';
/** Próximas trae hasta 50 (máximo de la API) para agrupar bien por evento. */
const POR_PAGINA: Record<'PROXIMAS' | 'HISTORIAL', number> = { PROXIMAS: 50, HISTORIAL: 10 };

/**
 * US-52 · TASK-60 — Mis entradas en Mi club. Próximas: las que todavía sirven,
 * por fecha del evento. Historial: usadas y vencidas (también las de eventos
 * terminados o cancelados, aunque la tarea de cierre no haya corrido).
 */
export function MisEntradasPage() {
  const [pestania, setPestania] = useState<Pestania>('PROXIMAS');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(POR_PAGINA.PROXIMAS);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const filtroBusqueda = busquedaAplicada ? { search: busquedaAplicada } : {};
  const proximas = useMisEntradas({
    vigencia: 'PROXIMAS',
    ...filtroBusqueda,
    ...(pestania === 'PROXIMAS' ? { page: pagina, limit: porPagina } : { page: 1, limit: 1 }),
  });
  const historial = useMisEntradas({
    vigencia: 'HISTORIAL',
    ...filtroBusqueda,
    ...(pestania === 'HISTORIAL' ? { page: pagina, limit: porPagina } : { page: 1, limit: 1 }),
  });

  const activa = pestania === 'PROXIMAS' ? proximas : historial;
  const entradas = activa.data?.items ?? [];
  const grupos = agruparPorEvento(entradas);
  const total = activa.data?.total ?? 0;

  const cambiarPestania = (nueva: Pestania) => {
    setPestania(nueva);
    setPagina(1);
    setPorPagina(POR_PAGINA[nueva]);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis entradas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mostrá el QR en la puerta o descargalo. Las usadas y vencidas quedan en el historial.
          </p>
        </div>
        <Link
          to={ROUTES.eventos}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <Ticket size={16} aria-hidden /> Comprar entradas
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs<Pestania>
          aria-label="Vigencia de las entradas"
          value={pestania}
          onChange={cambiarPestania}
          tabs={[
            { value: 'PROXIMAS', label: 'Próximas', count: proximas.data?.total },
            { value: 'HISTORIAL', label: 'Historial', count: historial.data?.total },
          ]}
        />
        <div className="w-full sm:max-w-xs">
          <Input
            data-testid="buscar-entradas-input"
            aria-label="Buscar por evento"
            placeholder="Buscar por evento…"
            leftIcon={<Search />}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {activa.isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando entradas">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : activa.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus entradas. Probá de nuevo en unos minutos.
        </div>
      ) : grupos.length > 0 ? (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <EntradasEventoCard key={`${pestania}-${grupo.eventoId}`} grupo={grupo} />
          ))}
          {total > porPagina && (
            <TablePagination
              pagina={pagina}
              porPagina={porPagina}
              total={total}
              isFetching={activa.isFetching}
              onChangePagina={setPagina}
              onChangePorPagina={(nuevo) => {
                setPorPagina(nuevo);
                setPagina(1);
              }}
            />
          )}
        </div>
      ) : (
        <EstadoVacio pestania={pestania} conBusqueda={Boolean(busquedaAplicada)} />
      )}
    </div>
  );
}

function EstadoVacio({ pestania, conBusqueda }: { pestania: Pestania; conBusqueda: boolean }) {
  if (conBusqueda) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No encontramos entradas para esa búsqueda.
      </div>
    );
  }
  const proximas = pestania === 'PROXIMAS';
  const Icono = proximas ? CalendarSearch : History;
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icono size={22} aria-hidden />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">
        {proximas ? 'No tenés entradas para próximos eventos' : 'Tu historial está vacío'}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {proximas
          ? 'Cuando compres una entrada va a aparecer acá, lista para mostrar en la puerta.'
          : 'Acá vas a ver las entradas que ya usaste y las de eventos que terminaron.'}
      </p>
      {proximas && (
        <Link
          to={ROUTES.eventos}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Ver eventos
        </Link>
      )}
    </div>
  );
}
