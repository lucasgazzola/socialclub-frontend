import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Search,
  Ticket,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import faviconBlanco from '@/assets/favicon-blanco.png';
import type { FiltrarEventosParams } from '@/features/eventos/api/eventos.api';
import { EventoDetalleModal } from '@/features/eventos/components/EventoDetalleModal';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  ventaAbierta,
} from '@/features/eventos/helpers';
import { useEventos } from '@/features/eventos/hooks/useEventos';
import type { Evento } from '@/features/eventos/types';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalEmptyState,
  PortalInput,
  PortalPageHeader,
  PortalPanel,
  PortalSelect,
  PortalStatusPill,
} from '../components/PortalUI';

const POR_PAGINA = 6;

export function PortalEventosPage() {
  const [eventoDetalle, setEventoDetalle] = useState<Evento | null>(null);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ordenar, setOrdenar] = useState<FiltrarEventosParams['ordenar']>('fecha');

  const params: FiltrarEventosParams = {
    pagina,
    porPagina: POR_PAGINA,
    ...(search ? { search } : {}),
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(ordenar ? { ordenar } : {}),
  };

  const { data: paginado, isLoading, isError } = useEventos(params);
  const totalPaginas = paginado?.totalPaginas ?? 1;
  const total = paginado?.total ?? 0;
  const eventos = paginado?.items ?? [];

  const tieneFiltrosActivos = Boolean(search || fechaDesde || fechaHasta || ordenar !== 'fecha');

  function limpiarFiltros() {
    setSearch('');
    setFechaDesde('');
    setFechaHasta('');
    setOrdenar('fecha');
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Eventos del club"
        subtitle="Explorá los próximos encuentros, torneos y actividades para adquirir tus entradas digitales."
      />

      {/* Filtros oscuros compactos */}
      <PortalPanel className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-3 text-zinc-500"
            />
            <PortalInput
              id="buscar-evento"
              value={search}
              placeholder="Buscar por nombre o lugar…"
              className="pl-9"
              onChange={(e) => {
                setSearch(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <PortalInput
            id="evento-desde"
            type="date"
            aria-label="Desde fecha"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPagina(1);
            }}
          />

          <PortalInput
            id="evento-hasta"
            type="date"
            aria-label="Hasta fecha"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPagina(1);
            }}
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PortalSelect
                id="ordenar-evento"
                aria-label="Ordenar eventos"
                value={ordenar}
                onChange={(e) => {
                  setOrdenar(e.target.value as FiltrarEventosParams['ordenar']);
                  setPagina(1);
                }}
                options={[
                  { value: 'fecha', label: 'Más próximos' },
                  { value: 'nombre', label: 'Alfabético (A-Z)' },
                  { value: 'precio', label: 'Menor precio' },
                ]}
              />
            </div>
            {tieneFiltrosActivos && (
              <PortalButton variant="ghost" size="sm" onClick={limpiarFiltros}>
                Limpiar
              </PortalButton>
            )}
          </div>
        </div>
      </PortalPanel>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-7 w-7 text-zinc-400" />
        </div>
      ) : isError ? (
        <PortalPanel className="border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
          No se pudo cargar el calendario de eventos.
        </PortalPanel>
      ) : eventos.length === 0 ? (
        <PortalEmptyState
          icon={<CalendarPlus size={22} />}
          title="No encontramos eventos"
          description={
            tieneFiltrosActivos
              ? 'Probá ampliando el rango de fechas o limpiando los filtros de búsqueda.'
              : 'Todavía no hay eventos publicados en el calendario.'
          }
          action={
            tieneFiltrosActivos ? (
              <PortalButton variant="secondary" size="sm" onClick={limpiarFiltros}>
                Restablecer filtros
              </PortalButton>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {eventos.map((evento) => {
              const estadoVisual = getEstadoVisual(evento);
              const habilitadoComprar = ventaAbierta(evento);
              const precioTexto = formatPrecio(evento.precio);
              const precioSocioTexto = formatPrecioSocio(evento.precio, evento.descuentoSocio);
              const esDefaultImage =
                !evento.tempImageUrl &&
                (!evento.imageUrl || evento.imageUrl.includes('favicon-blanco.png'));
              const imageSrc = evento.tempImageUrl
                ? evento.tempImageUrl
                : esDefaultImage
                  ? faviconBlanco
                  : evento.imageUrl;

              return (
                <PortalPanel
                  key={evento.id}
                  className="group flex flex-col justify-between overflow-hidden transition-[border-color,background-color] duration-150 hover:border-white/[0.16] hover:bg-[#11151e]"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div
                      className={`relative shrink-0 overflow-hidden sm:w-40 ${
                        esDefaultImage
                          ? 'flex min-h-[120px] items-center justify-center bg-[#07090d] p-5'
                          : 'aspect-4/3 bg-[#07090d] sm:aspect-auto'
                      }`}
                    >
                      <img
                        src={imageSrc}
                        alt={evento.nombre}
                        className={
                          esDefaultImage
                            ? 'max-h-14 max-w-14 object-contain opacity-85'
                            : 'h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105'
                        }
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                            {evento.nombre}
                          </h2>
                          <PortalStatusPill
                            tone={habilitadoComprar ? 'active' : 'neutral'}
                            dot={habilitadoComprar}
                          >
                            {estadoVisual.label}
                          </PortalStatusPill>
                        </div>

                        <div className="mt-2.5 space-y-1 text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5 tabular-nums">
                            <Calendar size={13} className="text-zinc-500 shrink-0" />
                            <span>{formatFechaEvento(evento.fechaEvento)}</span>
                          </div>
                          {evento.lugarAcreditacion && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-zinc-500 shrink-0" />
                              <span className="truncate">{evento.lugarAcreditacion}</span>
                            </div>
                          )}
                        </div>

                        {evento.descripcion && (
                          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                            {evento.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
                        <div>
                          <span className="text-sm font-semibold tabular-nums text-white">
                            {precioTexto}
                          </span>
                          {precioSocioTexto && (
                            <span className="ml-2 text-[11px] font-medium text-emerald-400 tabular-nums">
                              Socios {precioSocioTexto}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <PortalButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setEventoDetalle(evento)}
                          >
                            <Info size={14} />
                            Detalle
                          </PortalButton>
                          {habilitadoComprar && (
                            <Link
                              to={ROUTES.comprarEntradas(evento.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-medium text-zinc-950 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-200 active:scale-[0.97]"
                            >
                              <Ticket size={13} />
                              Entradas
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PortalPanel>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
              <span className="tabular-nums">
                Página {pagina} de {totalPaginas} · {total} eventos
              </span>
              <div className="flex items-center gap-2">
                <PortalButton
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  Anterior
                </PortalButton>
                <PortalButton
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                >
                  Siguiente
                  <ChevronRight size={14} />
                </PortalButton>
              </div>
            </div>
          )}
        </div>
      )}

      {eventoDetalle && (
        <EventoDetalleModal
          evento={eventoDetalle}
          open={Boolean(eventoDetalle)}
          onClose={() => setEventoDetalle(null)}
        />
      )}
    </div>
  );
}
