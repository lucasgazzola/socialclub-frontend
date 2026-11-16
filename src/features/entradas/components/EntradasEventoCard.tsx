import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, FileText, Maximize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { QRCode } from './QRCode';
import { EstadoEntradaBadge } from './EstadoEntradaBadge';
import { QrPantallaCompleta } from './QrPantallaCompleta';
import {
  SELLO_ESTADO,
  claveEstadoEntrada,
  detalleEstadoEntrada,
  formatearFechaHora,
  type GrupoDeEntradas,
} from '../utils/estadoEntrada';
import {
  descargarEntradaPdf,
  descargarQR,
  descargarTodasEntradasPdf,
} from '../utils/descargarEntradaPdf';

/**
 * TASK-60 — Las entradas de un mismo evento en una sola tarjeta, con un
 * carrusel de QR. Las válidas se pueden mostrar en pantalla completa y
 * descargar; las usadas, vencidas o canceladas se ven en gris, con un sello y
 * sin descarga, para que no se confundan con las que todavía sirven.
 */
export function EntradasEventoCard({ grupo }: { grupo: GrupoDeEntradas }) {
  const [indice, setIndice] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const entrada = grupo.entradas[Math.min(indice, grupo.entradas.length - 1)];
  const estado = claveEstadoEntrada(entrada);
  const vigente = estado === 'VALIDA';
  const cantidad = grupo.entradas.length;
  const vigentes = grupo.entradas.filter((e) => claveEstadoEntrada(e) === 'VALIDA');
  const nombre = grupo.evento?.nombre ?? 'Evento';

  return (
    <article
      data-testid={`entradas-evento-${grupo.eventoId}`}
      aria-label={`Entradas para ${nombre}`}
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition-shadow',
        vigente ? 'border-slate-200 hover:shadow-md' : 'border-slate-200/70 bg-slate-50/60',
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Datos del evento */}
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoEntradaBadge estado={estado} data-testid={`entrada-badge-${entrada.id}`} />
            {cantidad > 1 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {cantidad} entradas
              </span>
            )}
          </div>

          <div>
            <h2 className={cn('text-lg font-bold tracking-tight', vigente ? 'text-slate-900' : 'text-slate-500')}>
              {nombre}
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Fecha</dt>
                <CalendarDays size={15} className="shrink-0 text-slate-400" aria-hidden />
                <dd className="capitalize">{formatearFechaHora(grupo.evento?.fechaEvento)}</dd>
              </div>
              {grupo.evento?.lugarAcreditacion && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Lugar</dt>
                  <MapPin size={15} className="shrink-0 text-slate-400" aria-hidden />
                  <dd>{grupo.evento.lugarAcreditacion}</dd>
                </div>
              )}
            </dl>
          </div>

          <p className={cn('text-sm font-medium', vigente ? 'text-emerald-700' : 'text-slate-500')}>
            {detalleEstadoEntrada(entrada)}
          </p>

          {vigente && (
            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPantallaCompleta(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              >
                <Maximize2 size={15} aria-hidden /> Mostrar en la puerta
              </button>
              <button
                type="button"
                data-testid={`btn-descargar-pdf-${entrada.id}`}
                onClick={() =>
                  vigentes.length > 1 ? descargarTodasEntradasPdf(vigentes) : descargarEntradaPdf(entrada)
                }
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FileText size={15} aria-hidden /> {vigentes.length > 1 ? 'PDF con todas' : 'PDF'}
              </button>
              <button
                type="button"
                data-testid={`btn-descargar-qr-${entrada.id}`}
                onClick={() => descargarQR(entrada)}
                aria-label="Descargar el QR como imagen"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Download size={15} aria-hidden /> QR
              </button>
            </div>
          )}
        </div>

        {/* QR con carrusel */}
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 border-t p-5 sm:w-64 sm:border-l sm:border-t-0',
            vigente ? 'border-slate-100 bg-gradient-to-b from-brand-50/60 to-white' : 'border-slate-200/70 bg-slate-100/50',
          )}
        >
          <div className="relative">
            <div
              className={cn(
                'rounded-2xl bg-white p-2.5 ring-1 ring-slate-200',
                !vigente && 'opacity-35 grayscale',
              )}
            >
              <QRCode value={entrada.token} size={156} />
            </div>
            {estado !== 'VALIDA' && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-lg border-[3px] bg-white/90 px-3 py-1 text-base font-black tracking-[0.2em]',
                  estado === 'USADA' && 'border-slate-500 text-slate-600',
                  estado === 'VENCIDA' && 'border-amber-600 text-amber-700',
                  estado === 'CANCELADA' && 'border-rose-600 text-rose-700',
                )}
              >
                {SELLO_ESTADO[estado]}
              </span>
            )}
          </div>

          <p className="break-all text-center font-mono text-[11px] leading-tight text-slate-400">{entrada.token}</p>

          {cantidad > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIndice((i) => Math.max(i - 1, 0))}
                disabled={indice === 0}
                aria-label="Entrada anterior"
                className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-slate-600" aria-live="polite">
                {indice + 1} de {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setIndice((i) => Math.min(i + 1, cantidad - 1))}
                disabled={indice === cantidad - 1}
                aria-label="Entrada siguiente"
                className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {pantallaCompleta && (
        <QrPantallaCompleta
          entradas={vigentes}
          indiceInicial={Math.max(0, vigentes.findIndex((e) => e.id === entrada.id))}
          onCerrar={() => setPantallaCompleta(false)}
        />
      )}
    </article>
  );
}
