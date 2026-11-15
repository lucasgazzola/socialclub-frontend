import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useEvento } from '@/features/eventos/hooks/useEventos';
import { ventaAbierta } from '@/features/eventos/helpers';
import { useIniciarCompraEntradas } from '@/features/entradas/hooks/useEntradas';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { ROUTES } from '@/routes/paths';
import { PortalConfirmarPagoModal } from '../components/PortalModals';
import {
  PortalButton,
  PortalFieldInput,
  PortalSpinner,
  PortalSurface,
  PortalTitleBar,
} from '../components/PortalUI';

export function PortalComprarEntradasPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const id = Number(eventoId);
  const { data: evento, isLoading, isError, error } = useEvento(id);
  const comprar = useIniciarCompraEntradas();
  const navigate = useNavigate();

  const [cantidad, setCantidad] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);

  const precio = Number(evento?.precio ?? 0);
  const maxCantidad = evento?.entradasDisponibles ?? 0;
  const ventaHabilitada = Boolean(evento && ventaAbierta(evento));

  async function confirmarPago() {
    try {
      const orden = await comprar.mutateAsync({ eventoId: id, cantidad });
      if (orden.urlPago) {
        irAPagar(orden.urlPago);
      } else {
        navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
      }
    } catch (errorDesconocido) {
      toast.error(
        errorDesconocido instanceof Error ? errorDesconocido.message : 'No se pudo iniciar la compra.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Comprar entradas"
        summary={isLoading ? 'Cargando actividad…' : evento?.nombre}
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : isError ? (
        <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {error instanceof Error ? error.message : 'No se pudo cargar el evento.'}
        </PortalSurface>
      ) : evento ? (
        <>
          <PortalSurface className="max-w-2xl space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">{evento.nombre}</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {evento.descripcion ?? 'Sin descripción disponible.'}
              </p>
            </div>

            <div className="grid gap-3 border-y border-slate-300/[0.08] py-4 sm:grid-cols-3">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Precio unitario
                </span>
                <p className="mt-1 text-base font-semibold text-white tabular-nums">
                  ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Disponibles
                </span>
                <p className="mt-1 text-base font-semibold text-white tabular-nums">{maxCantidad}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Total estimado
                </span>
                <p className="mt-1 text-base font-semibold text-blue-400 tabular-nums">
                  ${(cantidad * precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="w-36">
                <PortalFieldInput
                  id="cantidad"
                  label="Cantidad"
                  type="number"
                  min={1}
                  max={maxCantidad}
                  value={cantidad}
                  onChange={(event) =>
                    setCantidad(Math.min(maxCantidad, Math.max(1, Number(event.target.value))))
                  }
                />
              </div>
              <PortalButton
                variant="primary"
                onClick={() => setModalAbierto(true)}
                disabled={!ventaHabilitada || maxCantidad < 1}
              >
                <Ticket size={15} /> Comprar entradas
              </PortalButton>
            </div>

            {!ventaHabilitada && (
              <p className="text-xs text-amber-300">La venta no está habilitada para este evento.</p>
            )}
          </PortalSurface>

          <PortalConfirmarPagoModal
            open={modalAbierto}
            onClose={() => setModalAbierto(false)}
            titulo={`${cantidad} entrada(s)`}
            detalle={evento.nombre}
            total={cantidad * precio}
            onConfirmar={() => void confirmarPago()}
            isLoading={comprar.isPending}
          />
        </>
      ) : null}
    </div>
  );
}
