import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, MapPin, Sun, X } from 'lucide-react';
import { QRCode } from './QRCode';
import type { Entrada } from '../types';
import { formatearFechaHora } from '../utils/estadoEntrada';

interface QrPantallaCompletaProps {
  entradas: Entrada[];
  indiceInicial?: number;
  onCerrar: () => void;
}

/**
 * TASK-60 — Muestra el QR grande sobre fondo blanco para escanearlo en la
 * puerta desde el celular. Con varias entradas del mismo evento se pasa de
 * una a otra con las flechas (o el teclado). Escape cierra.
 */
export function QrPantallaCompleta({ entradas, indiceInicial = 0, onCerrar }: QrPantallaCompletaProps) {
  const [indice, setIndice] = useState(indiceInicial);
  const entrada = entradas[indice];
  const varias = entradas.length > 1;
  const lado = Math.min(360, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.72));

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowRight') setIndice((i) => Math.min(i + 1, entradas.length - 1));
      if (e.key === 'ArrowLeft') setIndice((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener('keydown', alTeclear);
    };
  }, [entradas.length, onCerrar]);

  if (!entrada) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Entrada para ${entrada.evento?.nombre ?? 'el evento'}`}
      className="fixed inset-0 z-[60] flex flex-col bg-white"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Sun size={14} aria-hidden /> Subí el brillo de la pantalla
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="rounded-full p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-10 text-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {entrada.evento?.nombre ?? 'Evento'}
          </h2>
          <p className="mt-1 text-sm capitalize text-slate-500">{formatearFechaHora(entrada.evento?.fechaEvento)}</p>
          {entrada.evento?.lugarAcreditacion && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={13} aria-hidden /> {entrada.evento.lugarAcreditacion}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 p-4 shadow-sm">
          <QRCode value={entrada.token} size={lado} />
        </div>

        <p className="font-mono text-xs text-slate-400">{entrada.token.slice(0, 8)}…</p>

        {varias && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIndice((i) => Math.max(i - 1, 0))}
              disabled={indice === 0}
              aria-label="Entrada anterior"
              className="rounded-full border border-slate-200 p-3 text-slate-700 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-28 text-sm font-semibold text-slate-700">
              Entrada {indice + 1} de {entradas.length}
            </span>
            <button
              type="button"
              onClick={() => setIndice((i) => Math.min(i + 1, entradas.length - 1))}
              disabled={indice === entradas.length - 1}
              aria-label="Entrada siguiente"
              className="rounded-full border border-slate-200 p-3 text-slate-700 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
