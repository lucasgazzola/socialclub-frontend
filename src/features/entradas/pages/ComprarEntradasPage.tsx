import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { useEvento } from '@/features/eventos/hooks/useEventos';
import { ventaAbierta } from '@/features/eventos/helpers';
import { ConfirmarPagoModal } from '@/features/pasarela/components/ConfirmarPagoModal';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { ROUTES } from '@/routes/paths';
import { useIniciarCompraEntradas } from '../hooks/useEntradas';

export function ComprarEntradasPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const id = Number(eventoId);
  const { data: evento, isLoading, isError, error } = useEvento(id);
  const comprar = useIniciarCompraEntradas();
  const navigate = useNavigate();

  const [cantidad, setCantidad] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);

  const precio = Number(evento?.precio ?? 0);
  const maxCantidad = evento?.entradasDisponibles ?? 0;
  const ventaHabilitada = !!evento && ventaAbierta(evento);

  // TASK-51: reserva el cupo y redirige a la pasarela (Mercado Pago o el simulador).
  // Al volver, las entradas quedan en «Mis entradas».
  async function confirmarPago() {
    try {
      const orden = await comprar.mutateAsync({ eventoId: id, cantidad });
      if (orden.urlPago) {
        irAPagar(orden.urlPago);
      } else {
        navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
      }
    } catch (errorDesconocido) {
      toast.error(errorDesconocido instanceof Error ? errorDesconocido.message : 'No se pudo iniciar la compra.');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Comprar entradas</h1>
        <p className="mt-1 text-sm text-slate-500">{isLoading ? 'Cargando evento…' : evento?.nombre}</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudo cargar el evento.'}
        </div>
      ) : evento ? (
        <>
          <Card className="max-w-2xl p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{evento.nombre}</h2>
                <p className="mt-1 text-sm text-slate-500">{evento.descripcion ?? 'Sin descripción.'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-slate-500">Precio unitario</span>
                  <p className="font-semibold">${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Disponibles</span>
                  <p className="font-semibold">{maxCantidad}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total</span>
                  <p className="font-semibold text-brand-700">
                    ${(cantidad * precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-40">
                  <Input
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
                <Button onClick={() => setModalAbierto(true)} disabled={!ventaHabilitada || maxCantidad < 1}>
                  <Ticket size={16} /> Comprar entradas
                </Button>
              </div>
              {!ventaHabilitada && (
                <p className="text-sm text-amber-700">La venta no está habilitada para este evento.</p>
              )}
            </div>
          </Card>

          <ConfirmarPagoModal
            isOpen={modalAbierto}
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
