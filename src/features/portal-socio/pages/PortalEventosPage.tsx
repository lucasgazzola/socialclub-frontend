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
import type { FiltrarEventosParams } from '@/features/eventos/api/eventos.api';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  ventaAbierta,
} from '@/features/eventos/helpers';
import { useEventos } from '@/features/eventos/hooks/useEventos';
import type { EstadoEventoBackend, Evento } from '@/features/eventos/types';
import { ROUTES } from '@/routes/paths';
import { PortalEventoDetalleModal } from '../components/PortalModals';
import {
  PortalButton,
  PortalEmptyState,
  PortalEventoVisual,
  PortalFieldInput,
  PortalFieldSelect,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

const POR_PAGINA = 6;

/**
 * Catálogo de eventos exclusivo del Portal de Socios y Participantes.
 */
export function PortalEventosPage() {
  const [eventoDetalle, setEventoDetalle] = useState<Evento | null>(null);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ordenar, setOrdenar] = useState<FiltrarEventosParams['ordenar']>('fecha');
  const [estado, setEstado] = useState<EstadoEventoBackend | ''>('');

  const params: FiltrarEventosParams = {
    pagina,
    porPagina: POR_PAGINA,
    ...(search ? { search } : {}),
    ...(fechaDesde ? { fechaDesde } : {}),
    ...(fechaHasta ? { fechaHasta } : {}),
    ...(ordenar ? { ordenar } : {}),
    ...(estado ? { estado } : {}),
  };

  const { data: paginado, isLoading, isError } = useEventos(params);
  const totalPaginas = paginado?.totalPaginas ?? 1;
  const total = paginado?.total ?? 0;
  const eventos = paginado?.items ?? [];

  const tieneFiltrosActivos = Boolean(
    search || fechaDesde || fechaHasta || estado || ordenar !== 'fecha',
  );

  function limpiarFiltros() {
    setSearch('');
    setFechaDesde('');
    setFechaHasta('');
    setOrdenar('fecha');
    setEstado('');
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Eventos del club"
        summary="Los próximos aparecen primero. Podés acotar por estado o por fecha."
      />

      <PortalSurface className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-3 text-slate-500"
            />
            <PortalFieldInput
              id="buscar-evento"
              value={search}
              placeholder="Buscar evento o sede…"
              className="pl-9"
              onChange={(e) => {
                setSearch(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <PortalFieldInput
            id="evento-desde"
            type="date"
            aria-label="Desde fecha"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPagina(1);
            }}
          />

          <PortalFieldInput
            id="evento-hasta"
            type="date"
            aria-label="Hasta fecha"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPagina(1);
            }}
          />

          <PortalFieldSelect
            id="estado-evento"
            aria-label="Filtrar por estado del evento"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoEventoBackend | '');
              setPagina(1);
            }}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'PUBLICADO', label: 'Publicados' },
              { value: 'FINALIZADO', label: 'Finalizados' },
              { value: 'CANCELADO', label: 'Cancelados' },
            ]}
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PortalFieldSelect
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
      </PortalSurface>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : isError ? (
        <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          No se pudo cargar el calendario de eventos.
        </PortalSurface>
      ) : eventos.length === 0 ? (
        <PortalEmptyState
          icon={<CalendarPlus size={20} />}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventos.map((evento) => {
              const estadoVisual = getEstadoVisual(evento);
              const habilitadoComprar = ventaAbierta(evento);
              const precioTexto = formatPrecio(evento.precio);
              const precioSocioTexto = formatPrecioSocio(evento.precio, evento.descuentoSocio);

              return (
                <PortalSurface
                  key={evento.id}
                  className="group flex flex-col justify-between overflow-hidden hover:border-blue-500/45 hover:bg-[#0a1322] hover:shadow-[0_14px_34px_-20px_rgba(37,99,235,0.65)]"
                >
                  <div className="flex flex-1 flex-col">
                    <div className="relative">
                      <PortalEventoVisual
                        nombre={evento.nombre}
                        imageUrl={evento.imageUrl}
                        tempImageUrl={evento.tempImageUrl}
                        logoSize={54}
                        className="h-40 w-full border-b border-white/[0.08]"
                      />
                      <div className="absolute top-3 right-3">
                        <PortalTag
                          tone={habilitadoComprar ? 'info' : 'neutral'}
                          dot={habilitadoComprar}
                          className="backdrop-blur-md"
                        >
                          {estadoVisual.label}
                        </PortalTag>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                      <div>
                        <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                          {evento.nombre}
                        </h2>

                        <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 tabular-nums">
                            <Calendar size={13} className="shrink-0 text-blue-400" />
                            <span>{formatFechaEvento(evento.fechaEvento)}</span>
                          </div>
                          {evento.lugarAcreditacion && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="shrink-0 text-blue-400" />
                              <span className="truncate">{evento.lugarAcreditacion}</span>
                            </div>
                          )}
                        </div>

                        {evento.descripcion && (
                          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                            {evento.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3.5">
                        <div>
                          <span className="text-sm font-semibold text-white tabular-nums">
                            {precioTexto}
                          </span>
                          {precioSocioTexto && (
                            <p className="text-[11px] font-medium text-blue-400 tabular-nums">
                              {precioSocioTexto}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <PortalButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setEventoDetalle(evento)}
                          >
                            <Info size={14} />
                            Detalle
                          </PortalButton>
                          {habilitadoComprar && (
                            <Link
                              to={ROUTES.comprarEntradas(evento.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-blue-400/45 bg-blue-600 px-3 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-blue-500 active:scale-[0.97]"
                            >
                              <Ticket size={13} />
                              Entradas
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PortalSurface>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
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
        <PortalEventoDetalleModal
          evento={eventoDetalle}
          open={Boolean(eventoDetalle)}
          onClose={() => setEventoDetalle(null)}
        />
      )}
    </div>
  );
}
