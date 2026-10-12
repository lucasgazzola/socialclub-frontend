import { useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Search, Pencil } from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { EventoForm, type EventoFormValues, type ActualizarEventoFormValues } from '../components/EventoForm';
import { EventoCard } from '../components/EventoCard';
import { EventoDetalleModal } from '../components/EventoDetalleModal';
import { useCrearEvento, useActualizarEvento, useEventos } from '../hooks/useEventos';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { FiltrarEventosParams } from '../api/eventos.api';
import type { Evento } from '../types';

const POR_PAGINA = 5;

export function EventosPage() {
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  const [eventoDetalle, setEventoDetalle] = useState<Evento | null>(null);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ordenar, setOrdenar] = useState<FiltrarEventosParams['ordenar']>('fecha');
  const [incluirBorradores, setIncluirBorradores] = useState(false);

  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN') ?? false;

  const params: FiltrarEventosParams = {
    pagina,
    porPagina: POR_PAGINA,
    ...(search ? { search } : {}),
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(ordenar ? { ordenar } : {}),
    ...(esAdmin && incluirBorradores ? { incluirBorradores: true } : {}),
  };

  const { data: paginado, isLoading, isError } = useEventos(params);
  const crearEvento = useCrearEvento();
  const actualizarEvento = useActualizarEvento();

  const puedeCrearEvento = esAdmin;
  const totalPaginas = paginado?.totalPaginas ?? 1;
  const total = paginado?.total ?? 0;
  const eventos = paginado?.items ?? [];

  const tieneFiltrosActivos = Boolean(
    search || fechaDesde || fechaHasta || ordenar !== 'fecha' || incluirBorradores,
  );

  function limpiarFiltros() {
    setSearch('');
    setFechaDesde('');
    setFechaHasta('');
    setOrdenar('fecha');
    setIncluirBorradores(false);
    setPagina(1);
  }

  async function handleCrear(values: EventoFormValues) {
    const { tempPreviewUrl, imagenFile, ...rest } = values;
    await crearEvento.mutateAsync({ ...rest, tempPreviewUrl, imagenFile });
    setModalCrearAbierto(false);
    setPagina(1);
  }

  async function handleEditar(values: ActualizarEventoFormValues) {
    if (!eventoEditando) return;
    const { tempPreviewUrl, imagenFile, ...rest } = values;
    await actualizarEvento.mutateAsync({
      id: eventoEditando.id,
      payload: { ...rest, tempPreviewUrl, imagenFile },
    });
    setEventoEditando(null);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná y explorá los eventos del club.</p>
        </div>
        {puedeCrearEvento && (
          <Button onClick={() => setModalCrearAbierto(true)} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} aria-hidden="true" />
            Nuevo evento
          </Button>
        )}
      </header>

      {/* ─── Filtros ─── */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <Input
              id="search-eventos"
              placeholder="buscar por nombre o descripción…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagina(1); }}
              leftIcon={<Search aria-hidden="true" />}
              containerClassName="flex-1"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="fecha-desde" className="font-medium whitespace-nowrap">Desde:</label>
              <input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPagina(1); }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="fecha-hasta" className="font-medium whitespace-nowrap">Hasta:</label>
              <input
                id="fecha-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPagina(1); }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Select
              id="ordenar-eventos"
              value={ordenar}
              onChange={(e) => { setOrdenar(e.target.value as FiltrarEventosParams['ordenar']); setPagina(1); }}
              className="w-auto"
              aria-label="Ordenar eventos por"
            >
              <option value="fecha">Ordenar: por fecha</option>
              <option value="nombre">Ordenar: por nombre</option>
              <option value="reciente">Ordenar: más recientes</option>
            </Select>

            {tieneFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-slate-500 hover:text-slate-800 text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {esAdmin && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 whitespace-nowrap">
              <input
                id="incluir-borradores"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={incluirBorradores}
                onChange={(e) => { setIncluirBorradores(e.target.checked); setPagina(1); }}
              />
              Ver borradores
            </label>
          </div>
        )}
      </div>

      {/* ─── Modal crear evento ─── */}
      <Modal
        open={modalCrearAbierto}
        title="Nuevo evento"
        description="Completá los datos para crear un nuevo evento."
        icon={<CalendarPlus />}
        size="lg"
        onClose={() => setModalCrearAbierto(false)}
      >
        <EventoForm
          modo="crear"
          onSubmit={handleCrear}
          submitLabel="Crear evento"
          onCancel={() => setModalCrearAbierto(false)}
        />
      </Modal>

      {/* ─── Modal editar evento (US-54) ─── */}
      <Modal
        open={eventoEditando !== null}
        title="Editar evento"
        description="Modificá los datos del evento. Los cambios en precio aplican solo a futuras compras."
        icon={<Pencil />}
        size="lg"
        onClose={() => setEventoEditando(null)}
      >
        {eventoEditando && (
          <EventoForm
            modo="editar"
            eventoInicial={eventoEditando}
            onSubmit={handleEditar}
            submitLabel="Guardar cambios"
            onCancel={() => setEventoEditando(null)}
          />
        )}
      </Modal>

      {/* ─── Modal detalle evento (US-53) ─── */}
      <EventoDetalleModal
        evento={eventoDetalle}
        open={eventoDetalle !== null}
        onClose={() => setEventoDetalle(null)}
      />

      {/* ─── Lista ─── */}
      {isLoading ? (
        <div className="space-y-4" data-testid="eventos-skeleton">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-[20px] border border-slate-200 bg-white p-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-28 w-full sm:w-1/4 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-1/3 rounded bg-slate-200" />
                  <div className="h-4 w-1/4 rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudieron cargar los eventos. Intentalo de nuevo más tarde.
        </div>
      ) : eventos.length === 0 ? (
        <div
          data-testid="eventos-vacio"
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 space-y-3"
        >
          <p>No hay eventos disponibles en este momento.</p>
          {tieneFiltrosActivos && (
            <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4" data-testid="eventos-lista">
          {eventos.map((evento) => (
            <EventoCard
              key={evento.id}
              evento={evento}
              onVerDetalle={setEventoDetalle}
              onEditar={esAdmin ? setEventoEditando : undefined}
            />
          ))}
        </div>
      )}

      {/* ─── Paginación ─── */}
      {!isLoading && !isError && totalPaginas > 1 && (
        <nav
          className="flex items-center justify-between border-t border-slate-200 pt-4"
          aria-label="Paginación de eventos"
          data-testid="paginacion-eventos"
        >
          <p className="text-sm text-slate-500">
            {total} evento{total !== 1 ? 's' : ''} · Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              aria-label="Página anterior"
              data-testid="pagina-anterior"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              aria-label="Página siguiente"
              data-testid="pagina-siguiente"
            >
              Siguiente
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

