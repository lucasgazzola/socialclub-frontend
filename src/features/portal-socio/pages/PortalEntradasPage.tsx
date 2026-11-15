import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MapPin,
  Maximize2,
  Search,
  Ticket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMisEntradas } from '@/features/entradas/hooks/useEntradas';
import {
  descargarEntradaPdf,
  descargarQR,
  descargarTodasEntradasPdf,
} from '@/features/entradas/utils/descargarEntradaPdf';
import { QrPantallaCompleta } from '@/features/entradas/components/QrPantallaCompleta';
import {
  SELLO_ESTADO,
  agruparPorEvento,
  claveEstadoEntrada,
  detalleEstadoEntrada,
  formatearFechaHora,
  type ClaveEstadoEntrada,
  type GrupoDeEntradas,
} from '@/features/entradas/utils/estadoEntrada';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/lib/utils/cn';
import { PortalQRCode } from '../components/PortalQRCode';
import {
  PortalButton,
  PortalEmptyState,
  PortalSegmentedSwitch,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

type Pestania = 'PROXIMAS' | 'HISTORIAL';
/** Próximas trae hasta 50 (máximo de la API) para agrupar bien por evento. */
const POR_PAGINA: Record<Pestania, number> = { PROXIMAS: 50, HISTORIAL: 10 };

const TAG_ESTADO: Record<ClaveEstadoEntrada, { tono: 'active' | 'neutral' | 'pending' | 'danger'; label: string }> = {
  VALIDA: { tono: 'active', label: 'Válida' },
  USADA: { tono: 'neutral', label: 'Usada' },
  VENCIDA: { tono: 'pending', label: 'Vencida' },
  CANCELADA: { tono: 'danger', label: 'Cancelada' },
};

/**
 * US-52 · DT-57 · TASK-60 — Entradas del portal con diseño de ticket. Próximas
 * (las que sirven) e Historial (usadas y vencidas, también de eventos terminados
 * o cancelados), agrupadas por evento y con el QR a pantalla completa para la puerta.
 */
export function PortalEntradasPage() {
  const navigate = useNavigate();
  const [pestania, setPestania] = useState<Pestania>('PROXIMAS');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const filtro = busquedaAplicada ? { search: busquedaAplicada } : {};
  const proximas = useMisEntradas({
    vigencia: 'PROXIMAS',
    ...filtro,
    ...(pestania === 'PROXIMAS' ? { page: pagina, limit: POR_PAGINA.PROXIMAS } : { page: 1, limit: 1 }),
  });
  const historial = useMisEntradas({
    vigencia: 'HISTORIAL',
    ...filtro,
    ...(pestania === 'HISTORIAL' ? { page: pagina, limit: POR_PAGINA.HISTORIAL } : { page: 1, limit: 1 }),
  });
  const activa = pestania === 'PROXIMAS' ? proximas : historial;
  const grupos = agruparPorEvento(activa.data?.items ?? []);
  const totalPaginas = activa.data?.totalPaginas ?? 1;

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Mis entradas"
        summary="Mostrá el QR en la puerta o descargalo. Las usadas y vencidas quedan en el historial."
        actions={
          <PortalButton variant="secondary" size="sm" onClick={() => navigate(ROUTES.eventos)}>
            Comprar entradas
          </PortalButton>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PortalSegmentedSwitch<Pestania>
          ariaLabel="Vigencia de las entradas"
          value={pestania}
          onChange={(nueva) => {
            setPestania(nueva);
            setPagina(1);
          }}
          tabs={[
            { value: 'PROXIMAS', label: 'Próximas', count: proximas.data?.total },
            { value: 'HISTORIAL', label: 'Historial', count: historial.data?.total },
          ]}
        />
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Buscar por evento</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            data-testid="buscar-entradas-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por evento…"
            className="h-10 w-full rounded-[2px] border border-white/[0.10] bg-[#050912] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/60 focus:outline-none"
          />
        </label>
      </div>

      {activa.isLoading ? (
        <div className="flex h-48 items-center justify-center" aria-busy="true" aria-label="Cargando entradas">
          <PortalSpinner />
        </div>
      ) : activa.isError ? (
        <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200" role="alert">
          No se pudieron cargar tus entradas. Intentá recargar la página.
        </PortalSurface>
      ) : grupos.length ? (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <TicketEvento key={`${pestania}-${grupo.eventoId}`} grupo={grupo} />
          ))}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
              <PortalButton variant="ghost" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft size={14} /> Anterior
              </PortalButton>
              <span className="tabular-nums">
                Página {pagina} de {totalPaginas}
              </span>
              <PortalButton
                variant="ghost"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente <ChevronRight size={14} />
              </PortalButton>
            </div>
          )}
        </div>
      ) : busquedaAplicada ? (
        <PortalEmptyState icon={<Search size={20} />} title="Sin resultados" description="No encontramos entradas para esa búsqueda." />
      ) : pestania === 'PROXIMAS' ? (
        <PortalEmptyState
          icon={<Ticket size={20} />}
          title="No tenés entradas para próximos eventos"
          description="Cuando compres una entrada va a aparecer acá, lista para mostrar en la puerta."
          action={
            <PortalButton variant="primary" size="sm" onClick={() => navigate(ROUTES.eventos)}>
              Ver eventos
            </PortalButton>
          }
        />
      ) : (
        <PortalEmptyState
          icon={<Ticket size={20} />}
          title="Tu historial está vacío"
          description="Acá vas a ver las entradas que ya usaste y las de eventos que terminaron."
        />
      )}
    </div>
  );
}

/** Ticket de un evento: todas sus entradas en un carrusel de QR. */
function TicketEvento({ grupo }: { grupo: GrupoDeEntradas }) {
  const [indice, setIndice] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const entrada = grupo.entradas[Math.min(indice, grupo.entradas.length - 1)];
  const estado = claveEstadoEntrada(entrada);
  const vigente = estado === 'VALIDA';
  const vigentes = grupo.entradas.filter((e) => claveEstadoEntrada(e) === 'VALIDA');
  const cantidad = grupo.entradas.length;
  const nombre = grupo.evento?.nombre ?? 'Evento';
  const tag = TAG_ESTADO[estado];

  return (
    <PortalSurface
      variant="pass"
      data-testid={`entradas-evento-${grupo.eventoId}`}
      aria-label={`Entradas para ${nombre}`}
      role="article"
      className={cn('relative grid grid-cols-1 overflow-hidden sm:grid-cols-[1fr_220px]', !vigente && 'opacity-80')}
    >
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-y-0 left-0 w-[2px]', vigente ? 'bg-blue-500' : 'bg-slate-600')}
      />

      <div className="flex flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span data-testid={`entrada-badge-${entrada.id}`}>
              <PortalTag tone={tag.tono} dot>
                {tag.label}
              </PortalTag>
            </span>
            {cantidad > 1 && <PortalTag tone="neutral">{cantidad} entradas</PortalTag>}
          </div>
          <h2 className={cn('mt-3 text-lg font-semibold tracking-[-0.02em]', vigente ? 'text-white' : 'text-slate-400')}>
            {nombre}
          </h2>
          <dl className="mt-2 space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Fecha</dt>
              <CalendarDays size={13} aria-hidden />
              <dd className="capitalize">{formatearFechaHora(grupo.evento?.fechaEvento)}</dd>
            </div>
            {grupo.evento?.lugarAcreditacion && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Lugar</dt>
                <MapPin size={13} aria-hidden />
                <dd>{grupo.evento.lugarAcreditacion}</dd>
              </div>
            )}
          </dl>
          <p className={cn('mt-3 text-sm font-medium', vigente ? 'text-emerald-300' : 'text-slate-400')}>
            {detalleEstadoEntrada(entrada)}
          </p>
        </div>

        {vigente && (
          <div className="flex flex-wrap gap-2">
            <PortalButton variant="primary" size="sm" onClick={() => setPantallaCompleta(true)}>
              <Maximize2 size={14} /> Mostrar en la puerta
            </PortalButton>
            <PortalButton
              variant="secondary"
              size="sm"
              onClick={() => (vigentes.length > 1 ? descargarTodasEntradasPdf(vigentes) : descargarEntradaPdf(entrada))}
            >
              <FileText size={14} /> {vigentes.length > 1 ? 'PDF con todas' : 'PDF'}
            </PortalButton>
            <PortalButton variant="secondary" size="sm" onClick={() => descargarQR(entrada)} aria-label="Descargar el QR como imagen">
              <Download size={14} /> QR
            </PortalButton>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-2.5 border-t border-dashed border-blue-400/30 bg-[#04070e]/90 p-5 sm:border-l sm:border-t-0">
        <div className="relative">
          <div className={cn('rounded-[2px] bg-white p-2', !vigente && 'opacity-35 grayscale')}>
            <PortalQRCode value={entrada.token} size={136} />
          </div>
          {estado !== 'VALIDA' && (
            <span
              aria-hidden
              className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-[3px] bg-[#03060c]/90 px-3 py-1 text-sm font-black tracking-[0.2em]',
                estado === 'USADA' && 'border-slate-400 text-slate-300',
                estado === 'VENCIDA' && 'border-amber-400 text-amber-300',
                estado === 'CANCELADA' && 'border-rose-400 text-rose-300',
              )}
            >
              {SELLO_ESTADO[estado]}
            </span>
          )}
        </div>
        <p className="break-all text-center font-mono text-[10px] leading-tight text-slate-500">{entrada.token}</p>
        {cantidad > 1 && (
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <button
              type="button"
              aria-label="Entrada anterior"
              disabled={indice === 0}
              onClick={() => setIndice((i) => Math.max(i - 1, 0))}
              className="rounded-[2px] border border-white/10 p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span aria-live="polite" className="tabular-nums">
              {indice + 1} de {cantidad}
            </span>
            <button
              type="button"
              aria-label="Entrada siguiente"
              disabled={indice === cantidad - 1}
              onClick={() => setIndice((i) => Math.min(i + 1, cantidad - 1))}
              className="rounded-[2px] border border-white/10 p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {pantallaCompleta && (
        <QrPantallaCompleta
          entradas={vigentes}
          indiceInicial={Math.max(0, vigentes.findIndex((e) => e.id === entrada.id))}
          onCerrar={() => setPantallaCompleta(false)}
        />
      )}
    </PortalSurface>
  );
}
