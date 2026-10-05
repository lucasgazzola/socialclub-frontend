import { Link } from 'react-router-dom';
import { Calendar, Clock, Ticket, MapPin } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import faviconBlanco from '@/assets/favicon-blanco.png';
import type { Evento } from '../types';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  puedeComprar,
} from '../helpers';

interface Props {
  evento: Evento;
}

export function EventoCard({ evento }: Props) {
  const estadoVisual = getEstadoVisual(evento);
  const estaHabilitadoComprar = puedeComprar(evento);
  const precioSocioTexto = formatPrecioSocio(evento.precio, evento.descuentoSocio);

  // La imagen temporal en estado local se pierde al recargar la página (comportamiento esperado).
  const tieneImagenTemp = Boolean(evento.tempImageUrl);
  const esDefaultImage =
    !tieneImagenTemp &&
    (!evento.imageUrl || evento.imageUrl.includes('favicon-blanco.png'));

  const imageSrc = tieneImagenTemp
    ? (evento.tempImageUrl as string)
    : esDefaultImage
      ? faviconBlanco
      : evento.imageUrl;

  const precioTexto = formatPrecio(evento.precio);
  const fechaInicioTexto = formatFechaEvento(evento.fechaEvento);
  const fechaFinTexto = evento.fechaFin ? formatFechaEvento(evento.fechaFin) : null;

  return (
    <article className="group flex flex-col sm:flex-row overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300">
      {/* ─── Imagen (~25% del ancho en pantallas md+) ─── */}
      <div
        className={`relative w-full sm:w-1/4 shrink-0 overflow-hidden sm:rounded-l-[20px] sm:rounded-r-none rounded-t-[20px] ${
          esDefaultImage
            ? 'bg-slate-900 flex items-center justify-center p-6 min-h-[120px] sm:min-h-0'
            : 'bg-slate-100 aspect-4/3 sm:aspect-auto'
        }`}
      >
        <img
          src={imageSrc}
          alt={evento.nombre}
          className={`${
            esDefaultImage
              ? 'object-contain max-h-20 max-w-20'
              : 'h-full w-full object-cover group-hover:scale-105 transition-transform duration-300'
          }`}
        />
      </div>

      {/* ─── Contenido derecho ─── */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        {/* Fila superior: Título + Badge de estado */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
              {evento.nombre}
            </h3>
            <Badge className={estadoVisual.badgeClass}>
              {estadoVisual.label}
            </Badge>
          </div>

          {/* Lugar de acreditación */}
          {evento.lugarAcreditacion && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
              <span>{evento.lugarAcreditacion}</span>
            </div>
          )}

          {/* Descripción con clamp de 2 líneas */}
          {evento.descripcion && (
            <p className="line-clamp-2 text-sm text-slate-600 leading-relaxed">
              {evento.descripcion}
            </p>
          )}
        </div>

        {/* ─── Chips fijos al fondo ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Chip Precio / Entradas */}
            {evento.requiereEntrada && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ${
                  estadoVisual.opacidadChipEntradasReducida ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <Ticket size={13} className="text-slate-500" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-slate-900">{precioTexto}</strong>
                  {evento.entradasDisponibles !== null && evento.entradasDisponibles !== undefined && (
                    <span className="text-slate-500"> · {evento.entradasDisponibles} disp.</span>
                  )}
                </span>
              </div>
            )}

            {/* Chip precio socio si hay descuento */}
            {precioSocioTexto && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                <span>{precioSocioTexto}</span>
              </div>
            )}

            {/* Chip Fecha inicio */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <Calendar size={13} className="text-slate-500" aria-hidden="true" />
              <span>{fechaInicioTexto}</span>
            </div>

            {/* Chip Fecha fin (si existe) */}
            {fechaFinTexto && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <Clock size={13} className="text-slate-500" aria-hidden="true" />
                <span>Fin: {fechaFinTexto}</span>
              </div>
            )}
          </div>

          {/* Acción: Comprar entradas */}
          {estaHabilitadoComprar && (
            <Link to={ROUTES.comprarEntradas(evento.id)}>
              <Button size="sm" className="shadow-xs shrink-0">
                <Ticket size={13} aria-hidden="true" />
                Comprar entradas
              </Button>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
