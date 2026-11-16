import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, ChevronRight, Clock, FileSearch } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type {
  AlertaDocumentacion,
  DocumentoPendienteRevision,
  TipoAlertaDocumentacion,
} from '../types';

const ESTADO_LABEL: Record<TipoAlertaDocumentacion, { texto: string; esCritica: boolean }> = {
  VENCIDO: { texto: 'Vencido', esCritica: true },
  PRESENTACION_VENCIDA: { texto: 'Plazo vencido', esCritica: true },
  POR_VENCER: { texto: 'Por vencer', esCritica: false },
  PRESENTACION_POR_VENCER: { texto: 'Falta presentar', esCritica: false },
};

function textoDias(diasRestantes: number): string {
  if (diasRestantes < 0) {
    return diasRestantes === -1 ? 'hace 1 día' : `hace ${-diasRestantes} días`;
  }
  if (diasRestantes === 0) return 'hoy';
  if (diasRestantes === 1) return 'mañana';
  return `en ${diasRestantes} días`;
}

function tiempoRelativo(fechaIso?: string): string | null {
  if (!fechaIso) return null;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return null;
  const diffMin = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 60_000));
  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return diffHoras === 1 ? 'hace 1 h' : `hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  return diffDias === 1 ? 'ayer' : `hace ${diffDias} días`;
}

interface NotificacionesBellProps {
  pendientes?: DocumentoPendienteRevision[];
  alertas: AlertaDocumentacion[];
}

export function NotificacionesBell({
  pendientes = [],
  alertas,
}: NotificacionesBellProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const total = pendientes.length + alertas.length;
  const primerosPendientes = useMemo(() => pendientes.slice(0, 3), [pendientes]);
  const primerasAlertas = useMemo(
    () =>
      [...alertas]
        .sort((a, b) => a.diasRestantes - b.diasRestantes)
        .slice(0, Math.max(2, 5 - primerosPendientes.length)),
    [alertas, primerosPendientes.length],
  );

  const irANotificaciones = () => {
    setAbierto(false);
    navigate(ROUTES.notificaciones);
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Notificaciones"
        aria-expanded={abierto}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell size={17} />
        {total > 0 && (
          <span
            aria-label={`${total} notificaciones pendientes`}
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
          />
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Notificaciones</span>
              <Badge variant={total > 0 ? 'default' : 'secondary'}>{total}</Badge>
            </div>
          </div>

          {/* Lista */}
          {total === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No tenés notificaciones pendientes.
            </div>
          ) : (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {primerosPendientes.length > 0 && (
                <div>
                  <p className="bg-slate-50/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Pendientes de revisión ({pendientes.length})
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {primerosPendientes.map((doc) => {
                      const disciplinasTexto =
                        doc.persona.inscripciones.map((i) => i.disciplina.nombre).join(', ') ||
                        'Sin disciplina';
                      return (
                        <li key={`rev-${doc.id}`}>
                          <button
                            type="button"
                            onClick={irANotificaciones}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                              <FileSearch size={14} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {doc.persona.apellido}, {doc.persona.nombre}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {disciplinasTexto} · {doc.tipo}
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-brand-700">
                                Pendiente de revisión
                                {tiempoRelativo(doc.creadoEn)
                                  ? ` · ${tiempoRelativo(doc.creadoEn)}`
                                  : ''}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {primerasAlertas.length > 0 && (
                <div>
                  <p className="bg-slate-50/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Alertas de documentación ({alertas.length})
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {primerasAlertas.map((alerta) => {
                      const { texto, esCritica } = ESTADO_LABEL[alerta.tipo];
                      return (
                        <li key={alerta.clave}>
                          <button
                            type="button"
                            onClick={irANotificaciones}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                          >
                            <span
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                esCritica
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {esCritica ? <AlertTriangle size={14} /> : <Clock size={14} />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {alerta.participante}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {alerta.disciplina} · {alerta.documento}
                              </p>
                              <p
                                className={`mt-0.5 text-xs font-medium ${
                                  esCritica ? 'text-rose-600' : 'text-amber-700'
                                }`}
                              >
                                {texto} · {textoDias(alerta.diasRestantes)}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <button
              type="button"
              onClick={irANotificaciones}
              className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              <span>Ver todas las notificaciones</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
