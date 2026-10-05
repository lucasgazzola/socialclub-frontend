import { useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Button, Input, Modal, Select, Spinner } from '@/components/ui';
import { EventoForm, type EventoFormValues } from '../components/EventoForm';
import { EventoCard } from '../components/EventoCard';
import { useCrearEvento, useEventos } from '../hooks/useEventos';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { FiltrarEventosParams } from '../api/eventos.api';

const POR_PAGINA = 5;

export function EventosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [ordenar, setOrdenar] = useState<FiltrarEventosParams['ordenar']>('fecha');
  const [incluirBorradores, setIncluirBorradores] = useState(false);

  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN') ?? false;

  const params: FiltrarEventosParams = {
    pagina,
    porPagina: POR_PAGINA,
    ...(search ? { search } : {}),
    ...(ordenar ? { ordenar } : {}),
    ...(esAdmin && incluirBorradores ? { incluirBorradores: true } : {}),
  };

  const { data: paginado, isLoading, isError } = useEventos(params);
  const crearEvento = useCrearEvento();

  const puedeCrearEvento = esAdmin;
  const totalPaginas = paginado?.totalPaginas ?? 1;
  const total = paginado?.total ?? 0;
  const eventos = paginado?.items ?? [];

  async function handleCrear(values: EventoFormValues) {
    const { tempPreviewUrl, imagenFile, ...rest } = values;
    await crearEvento.mutateAsync({ ...rest, tempPreviewUrl, imagenFile });
    setModalAbierto(false);
    setPagina(1);
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
          <Button onClick={() => setModalAbierto(true)} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} aria-hidden="true" />
            Nuevo evento
          </Button>
        )}
      </header>

      {/* ─── Filtros ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        {esAdmin && (
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
        )}
      </div>

      {/* ─── Modal crear evento ─── */}
      <Modal
        open={modalAbierto}
        title="Nuevo evento"
        description="Completá los datos para crear un nuevo evento."
        icon={<CalendarPlus />}
        size="lg"
        onClose={() => setModalAbierto(false)}
      >
        <EventoForm onSubmit={handleCrear} submitLabel="Crear evento" onCancel={() => setModalAbierto(false)} />
      </Modal>

      {/* ─── Lista ─── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6 text-blue-600" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudieron cargar los eventos. Intentalo de nuevo más tarde.
        </div>
      ) : eventos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No hay eventos disponibles en este momento.
        </div>
      ) : (
        <div className="space-y-4">
          {eventos.map((evento) => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}

      {/* ─── Paginación ─── */}
      {!isLoading && !isError && totalPaginas > 1 && (
        <nav
          className="flex items-center justify-between border-t border-slate-200 pt-4"
          aria-label="Paginación de eventos"
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
