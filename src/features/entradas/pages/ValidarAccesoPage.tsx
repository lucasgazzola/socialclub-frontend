import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, History, ArrowRight, Trash2, ArrowLeft, QrCode, Search, Filter } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { QRScanner } from '../components/QRScanner';
import { useValidarEntrada } from '../hooks/useEntradas';
import { useEventos } from '@/features/eventos/hooks/useEventos';

// Categorías mockeadas — se reemplazarán cuando el modelo Evento tenga el campo.
const CATEGORIAS_MOCK = [
  { value: '', label: 'Todas las categorías' },
  { value: 'deportivo', label: '🏅 Deportivo' },
  { value: 'social', label: '🎉 Social' },
  { value: 'cultural', label: '🎭 Cultural' },
  { value: 'formacion', label: '📚 Formación' },
  { value: 'infantil', label: '🧒 Infantil' },
];

interface ScanHistoryItem {
  id: string;
  token: string;
  timestamp: string;
  status: 'PERMITIDO' | 'EVENTO_INCORRECTO' | 'YA_USADA' | 'INVALIDA' | 'EXPIRADA';
  eventoId?: number;
  eventoNombre?: string;
  mensaje: string;
}

const STORAGE_KEY = 'socialclub_qr_scan_history';

export function ValidarAccesoPage() {
  const { eventoId: routeEventoId } = useParams<{ eventoId?: string }>();
  const navigate = useNavigate();
  const validarMutation = useValidarEntrada();

  // Estado del evento seleccionado (null indica que se debe mostrar la lista de selección)
  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(() => routeEventoId ?? null);
  const [currentResult, setCurrentResult] = useState<ScanHistoryItem | null>(null);

  // ── Filtros de búsqueda ────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  // Debounce: actualiza searchQuery 400ms después de que el usuario deja de escribir
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hook de eventos — refetch automático cuando cambia searchQuery
  const { data: eventos, isLoading: isLoadingEventos } = useEventos(
    searchQuery ? { search: searchQuery } : undefined
  );

  // Filtro de categoría en front (mockeado, sin campo real en backend todavía)
  const eventosFiltrados = categoriaFiltro
    ? eventos?.filter((evt) =>
        evt.nombre.toLowerCase().includes(categoriaFiltro) ||
        (evt.descripcion ?? '').toLowerCase().includes(categoriaFiltro)
      )
    : eventos;

  useEffect(() => {
    if (routeEventoId) {
      setSelectedEventoId(routeEventoId);
    }
  }, [routeEventoId]);

  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ScanHistoryItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Error al guardar historial en sessionStorage', e);
    }
  }, [history]);

  const handleClearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleScan = async (token: string) => {
    if (validarMutation.isPending) return;

    try {
      const res = await validarMutation.mutateAsync(token);

      const eventoEscaneadoId = res.entrada.eventoId;
      const eventoEscaneadoNombre = res.entrada.eventoNombre;

      let scanStatus: ScanHistoryItem['status'] = 'PERMITIDO';
      let mensajeStatus = `Acceso concedido para "${eventoEscaneadoNombre}"`;

      if (selectedEventoId && Number(selectedEventoId) !== eventoEscaneadoId) {
        scanStatus = 'EVENTO_INCORRECTO';
        const eventoSeleccionadoNombre = eventos?.find((e) => e.id === Number(selectedEventoId))?.nombre || 'evento seleccionado';
        mensajeStatus = `Entrada para "${eventoEscaneadoNombre}", pero se está controlando "${eventoSeleccionadoNombre}".`;
      }

      const item: ScanHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        token,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: scanStatus,
        eventoId: eventoEscaneadoId,
        eventoNombre: eventoEscaneadoNombre,
        mensaje: mensajeStatus,
      };

      setCurrentResult(item);
      setHistory((prev) => [item, ...prev]);
    } catch (err: any) {
      const statusHttp = err?.response?.status;
      const errorMsg = err?.response?.data?.message || err?.message || 'Error al validar la entrada.';

      let scanStatus: ScanHistoryItem['status'] = 'INVALIDA';
      if (statusHttp === 409) {
        scanStatus = 'YA_USADA';
      } else if (statusHttp === 400 && errorMsg.toLowerCase().includes('expirada')) {
        scanStatus = 'EXPIRADA';
      }

      const currentEvtId = selectedEventoId ? Number(selectedEventoId) : undefined;
      const currentEvtNombre = currentEvtId ? eventos?.find((e) => e.id === currentEvtId)?.nombre : undefined;

      const item: ScanHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        token,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: scanStatus,
        eventoId: currentEvtId,
        eventoNombre: currentEvtNombre,
        mensaje: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      };

      setCurrentResult(item);
      setHistory((prev) => [item, ...prev]);
    }
  };

  const handleReset = () => {
    setCurrentResult(null);
  };

  const eventoSeleccionado = selectedEventoId
    ? eventos?.find((e) => e.id === Number(selectedEventoId))
    : null;

  // Filtrar historial según el evento seleccionado
  const filteredHistory = !selectedEventoId
    ? history
    : history.filter((h) => h.eventoId === Number(selectedEventoId));

  const totalPermitidos = filteredHistory.filter((h) => h.status === 'PERMITIDO').length;
  const totalRechazados = filteredHistory.filter((h) => h.status !== 'PERMITIDO').length;

  // ── Paginación ─────────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página cuando cambian los filtros
  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoriaFiltro]);

  const totalEventos = eventosFiltrados?.length ?? 0;
  const totalPages = Math.ceil(totalEventos / PAGE_SIZE);
  const eventosPaginados = eventosFiltrados?.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ----------------─────────────────────────────────────────────────────────────
  // VISTA 1: LISTA DE SELECCIÓN DE EVENTOS (con filtros)
  // ----------------─────────────────────────────────────────────────────────────
  if (selectedEventoId === null) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-brand-600" size={28} />
              Validación de Acceso por QR
            </h1>
            <p className="text-sm text-slate-500">
              Seleccioná un evento para iniciar el control de ingreso en puerta.
            </p>
          </div>
        </header>

        {/* ── Barra de filtros ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar evento por nombre o descripción..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-xs"
            />
          </div>

          {/* Dropdown de categoría (mockeado) */}
          <div className="relative min-w-[220px]">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-xs cursor-pointer"
            >
              {CATEGORIAS_MOCK.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ▾
            </div>
          </div>
        </div>

        {/* ── Lista de Eventos ─────────────────────────────────────────────── */}
        {isLoadingEventos ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : totalEventos === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <QrCode size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron eventos</p>
            <p className="text-xs text-slate-400 mt-1">Probá con otro término de búsqueda o categoría.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100 overflow-hidden">
              {eventosPaginados?.map((evt) => (
                <div
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 transition-colors gap-4 cursor-pointer"
                  onClick={() => setSelectedEventoId(String(evt.id))}
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{evt.nombre}</h3>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">
                      Entradas vendidas: <strong className="text-slate-900">{evt.entradasVendidas}</strong> | Disponibles: <strong>{evt.entradasDisponibles}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {evt.descripcion || 'Sin descripción adicional'}
                    </p>
                  </div>

                  <Button variant="primary" className="shrink-0 self-end sm:self-center">
                    <QrCode size={16} className="mr-1.5" />
                    Escanear QR
                  </Button>
                </div>
              ))}
            </div>

            {/* ── Paginador ─────────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalEventos)} de <strong>{totalEventos}</strong> eventos
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            currentPage === p
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }



  // ----------------─────────────────────────────────────────────────────────────
  // VISTA 2: ESCÁNER DE CÁMARA + CONTROL DE ACCESO (Evento Seleccionado)
  // ----------------─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Botón para cambiar de evento */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (routeEventoId) {
              navigate('/entradas/validar');
            }
            setSelectedEventoId(null);
          }}
        >
          <ArrowLeft size={18} className="mr-1" />
          Cambiar de Evento
        </Button>
      </div>

      {/* Encabezado sin dropdown adicional */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-brand-600" size={28} />
          Control de Acceso: {eventoSeleccionado?.nombre}
        </h1>
        <p className="text-sm text-slate-500">
          Control de ingresos en vivo para "{eventoSeleccionado?.nombre}".
        </p>
      </div>

      {/* Tarjeta de Métricas del Evento Seleccionado */}
      <div className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-xs border border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Evento Activo</span>
          <h3 className="text-base font-bold text-slate-800">
            {eventoSeleccionado?.nombre}
          </h3>
          {eventoSeleccionado && (
            <p className="text-xs text-slate-500 mt-0.5">
              Entradas vendidas: {eventoSeleccionado.entradasVendidas} / Disponibles: {eventoSeleccionado.entradasDisponibles}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <div className="text-center">
            <p className="text-xs font-medium text-slate-500">Permitidos</p>
            <p className="text-lg font-bold text-emerald-600">{totalPermitidos}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-xs font-medium text-slate-500">Rechazados</p>
            <p className="text-lg font-bold text-red-600">{totalRechazados}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Columna Izquierda: Escáner QR / Input */}
        <div className="md:col-span-6 space-y-6">
          <QRScanner onScan={handleScan} isScanningPaused={!!currentResult || validarMutation.isPending} />

          {validarMutation.isPending && (
            <Card className="p-4 flex items-center justify-center gap-3 bg-brand-50 border-brand-200 text-brand-700">
              <Spinner className="h-5 w-5" />
              <span className="font-medium text-sm">Validando entrada en el servidor...</span>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Resultado de Lectura e Historial */}
        <div className="md:col-span-6 space-y-6">
          {/* Resultado Actual */}
          {currentResult ? (
            <Card
              className={`p-6 border-2 transition-all shadow-md ${
                currentResult.status === 'PERMITIDO'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : currentResult.status === 'EVENTO_INCORRECTO'
                  ? 'border-amber-500 bg-amber-50/50'
                  : currentResult.status === 'YA_USADA'
                  ? 'border-red-500 bg-red-50/50'
                  : 'border-red-500 bg-red-50/50'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {currentResult.status === 'PERMITIDO' && (
                  <>
                    <CheckCircle2 size={56} className="text-emerald-600 mb-2 animate-bounce" />
                    <h2 className="text-xl font-bold text-emerald-900">¡ACCESO PERMITIDO!</h2>
                    {currentResult.eventoNombre && (
                      <p className="text-sm font-semibold text-emerald-700 mt-1">
                        Evento: {currentResult.eventoNombre}
                      </p>
                    )}
                    <p className="text-xs text-emerald-600 mt-2 font-mono break-all">
                      Token: {currentResult.token}
                    </p>
                  </>
                )}

                {currentResult.status === 'EVENTO_INCORRECTO' && (
                  <>
                    <AlertTriangle size={56} className="text-amber-600 mb-2 animate-pulse" />
                    <h2 className="text-xl font-bold text-amber-900">¡ENTRADA DE OTRO EVENTO!</h2>
                    <p className="text-sm font-medium text-amber-800 mt-2">
                      {currentResult.mensaje}
                    </p>
                    <div className="mt-3 rounded-md bg-amber-100 p-2 text-xs text-amber-900 font-semibold">
                      ⚠️ Esta entrada es válida, pero no corresponde a este evento.
                    </div>
                  </>
                )}

                {currentResult.status === 'YA_USADA' && (
                  <>
                    <AlertTriangle size={56} className="text-red-600 mb-2 animate-pulse" />
                    <h2 className="text-xl font-bold text-red-900">¡ENTRADA YA UTILIZADA!</h2>
                    <p className="text-sm font-medium text-red-800 mt-2">
                      {currentResult.mensaje}
                    </p>
                    <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-900 font-semibold">
                      ⛔ Posible intento de reingreso no autorizado.
                    </div>
                  </>
                )}

                {(currentResult.status === 'INVALIDA' || currentResult.status === 'EXPIRADA') && (
                  <>
                    <XCircle size={56} className="text-red-600 mb-2" />
                    <h2 className="text-xl font-bold text-red-900">
                      {currentResult.status === 'EXPIRADA' ? '¡ENTRADA EXPIRADA!' : '¡CÓDIGO QR INVÁLIDO!'}
                    </h2>
                    <p className="text-sm font-medium text-red-800 mt-2">
                      {currentResult.mensaje}
                    </p>
                  </>
                )}

                <Button
                  type="button"
                  variant={currentResult.status === 'PERMITIDO' ? 'primary' : 'secondary'}
                  className="mt-6 w-full"
                  onClick={handleReset}
                >
                  Escanear Siguiente Entrada
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed border-slate-300 bg-slate-50/50">
              <ShieldCheck size={48} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-base font-semibold text-slate-700">Listo para escanear</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apunta el escáner a una entrada QR o ingresá el token manualmente para iniciar la validación.
              </p>
            </Card>
          )}

          {/* Historial de la Sesión */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History size={16} className="text-slate-500" />
                Historial del evento ({filteredHistory.length})
              </h3>
              <div className="flex items-center gap-2">
                {filteredHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-slate-400 hover:text-red-600 transition-colors p-0.5 rounded-xs"
                    title="Limpiar historial de lecturas"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay lecturas registradas para este evento.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredHistory.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-xs bg-white"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {item.status === 'PERMITIDO' ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : item.status === 'EVENTO_INCORRECTO' ? (
                        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-medium text-slate-800 truncate">
                          {item.eventoNombre || item.token.slice(0, 13) + '...'}
                        </p>
                        <p className="text-[10px] text-slate-400">{item.mensaje}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
