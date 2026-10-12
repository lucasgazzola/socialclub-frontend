import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, Users, Info } from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import faviconBlanco from '@/assets/favicon-blanco.png';
import type { Evento } from '../types';
import {
  formatFechaEvento,
  formatPrecio,
  formatPrecioSocio,
  getEstadoVisual,
  puedeComprar,
  ventaAbierta,
} from '../helpers';

interface EventoDetalleModalProps {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
}

export function EventoDetalleModal({ evento, open, onClose }: EventoDetalleModalProps) {
  if (!evento) return null;

  const estadoVisual = getEstadoVisual(evento);
  const estaEnPeriodoVenta = ventaAbierta(evento);
  const estaHabilitadoComprar = puedeComprar(evento) && estaEnPeriodoVenta;

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
  const precioSocioTexto = formatPrecioSocio(evento.precio, evento.descuentoSocio);
  const fechaInicioTexto = formatFechaEvento(evento.fechaEvento);
  const fechaFinTexto = evento.fechaFin ? formatFechaEvento(evento.fechaFin) : null;
  const inicioVentaTexto = evento.inicioVenta ? formatFechaEvento(evento.inicioVenta) : null;
  const finVentaTexto = evento.finVenta ? formatFechaEvento(evento.finVenta) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={evento.nombre}
      description="Información detallada de la actividad."
      icon={<Info aria-hidden="true" />}
      size="lg"
    >
      <div className="space-y-6" data-testid="evento-detalle-modal">
        {/* ─── Imagen de cabecera ─── */}
        <div
          className={`relative overflow-hidden rounded-2xl border border-slate-200 ${
            esDefaultImage
              ? 'bg-slate-900 flex items-center justify-center p-8 h-40'
              : 'bg-slate-100 aspect-16/9 max-h-56'
          }`}
        >
          <img
            src={imageSrc}
            alt={evento.nombre}
            className={`${
              esDefaultImage
                ? 'object-contain max-h-24 max-w-24'
                : 'h-full w-full object-cover'
            }`}
          />
          <div className="absolute top-3 right-3">
            <Badge className={estadoVisual.badgeClass}>{estadoVisual.label}</Badge>
          </div>
        </div>

        {/* ─── Datos clave del evento ─── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Fecha y hora */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <Calendar className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-500">Fecha y hora</p>
              <p className="text-sm font-semibold text-slate-900">{fechaInicioTexto}</p>
              {fechaFinTexto && (
                <p className="text-xs text-slate-600 mt-0.5">Fin: {fechaFinTexto}</p>
              )}
            </div>
          </div>

          {/* Lugar de acreditación */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <MapPin className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-500">Lugar de acreditación</p>
              <p className="text-sm font-semibold text-slate-900">
                {evento.lugarAcreditacion || 'A definir en sede del club'}
              </p>
            </div>
          </div>

          {/* Precio y acceso */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <Ticket className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-500">Entrada y precio</p>
              <p className="text-sm font-semibold text-slate-900">
                {!evento.requiereEntrada ? 'Acceso libre y gratuito' : precioTexto}
              </p>
              {precioSocioTexto && (
                <p className="text-xs text-emerald-700 font-medium mt-0.5">{precioSocioTexto}</p>
              )}
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <Users className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-500">Disponibilidad</p>
              {!evento.requiereEntrada ? (
                <p className="text-sm font-medium text-slate-700">Sin límite de capacidad</p>
              ) : estaEnPeriodoVenta ? (
                <p className="text-sm font-semibold text-slate-900">
                  {evento.entradasDisponibles !== null && evento.entradasDisponibles !== undefined
                    ? `${evento.entradasDisponibles} entradas disponibles`
                    : 'Disponibilidad abierta'}
                  {evento.capacidadMaxima ? ` (Capacidad: ${evento.capacidadMaxima})` : ''}
                </p>
              ) : estadoVisual.key === 'VENTA_PROXIMA' ? (
                <p className="text-sm font-medium text-amber-700">Venta próxima a comenzar</p>
              ) : estadoVisual.key === 'VENTA_CERRADA' ? (
                <p className="text-sm font-medium text-slate-600">Período de venta finalizado</p>
              ) : estadoVisual.key === 'AGOTADO' ? (
                <p className="text-sm font-medium text-rose-700">Entradas agotadas</p>
              ) : (
                <p className="text-sm font-medium text-slate-600">No disponible para compra</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Período de venta si requiere entrada ─── */}
        {evento.requiereEntrada && (inicioVentaTexto || finVentaTexto) && (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Clock size={14} className="text-slate-500" aria-hidden="true" />
              <span>Período de venta de entradas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {inicioVentaTexto && (
                <p>
                  <span className="text-slate-500">Inicio de venta:</span>{' '}
                  <strong className="text-slate-700">{inicioVentaTexto}</strong>
                </p>
              )}
              {finVentaTexto && (
                <p>
                  <span className="text-slate-500">Fin de venta:</span>{' '}
                  <strong className="text-slate-700">{finVentaTexto}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Descripción completa ─── */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Descripción
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            {evento.descripcion || 'Sin descripción detallada disponible para este evento.'}
          </p>
        </div>

        {/* ─── Acciones ─── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          {estaHabilitadoComprar && (
            <Link to={ROUTES.comprarEntradas(evento.id)}>
              <Button className="gap-2 shadow-xs">
                <Ticket size={16} aria-hidden="true" />
                Comprar entradas
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
