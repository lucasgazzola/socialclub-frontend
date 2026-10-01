import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useEvento } from '@/features/eventos/hooks/useEventos';
import { MockPasarelaEntradasModal } from '../components/MockPasarelaEntradasModal';
import { QRCode } from '../components/QRCode';
import { useComprarEntradas } from '../hooks/useEntradas';
import type { Entrada } from '../types';
import type { MockPagoFormData } from '@/features/pagos/schemas/pago.schema';

export function ComprarEntradasPage() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const id = Number(eventoId); // Convierte el ID a numero para usarlo en las queries y mutaciones
  const navigate = useNavigate(); // Para volver a la pagina de eventos despues de generar las entradas
  const { data: evento, isLoading, isError, error } = useEvento(id); //Trae los datos del evento
  const comprar = useComprarEntradas();
  /**
   * Hook-Mutacion para crear entradas.
   * mutateAsync es la funcion para ejecutar la mutacion de crear entradas.
   */
  const [cantidad, setCantidad] = useState(1); // Estado para la cantidad de entradas a generar, inicialmente es 1
  const [modalAbierto, setModalAbierto] = useState(false);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const precio = Number(evento?.precio ?? 0);
  /**
   * Calcula la cantidad maxima de entradas disponibles para el evento.
   * Si no hay evento, se asume 1.
   */
  const maxCantidad = evento?.entradasDisponibles ?? 0;
  const ventaHabilitada = evento?.estado === 'PUBLICADO' && !!evento.inicioVenta && !!evento.finVenta && Date.now() >= Date.parse(evento.inicioVenta) && Date.now() <= Date.parse(evento.finVenta);

  async function confirmarPago(data: MockPagoFormData) {
    try {
      const resultado = await comprar.mutateAsync({ eventoId: id, cantidad, ...data });
      setEntradas(resultado.entradas);
      setModalAbierto(false);
      toast.success('Compra confirmada. Tus entradas ya están disponibles.');
    } catch (errorDesconocido) {
      toast.error(errorDesconocido instanceof Error ? errorDesconocido.message : 'No se pudo completar la compra.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.eventos)}><ArrowLeft size={24} /></Button>
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Comprar entradas</h1><p className="mt-1 text-sm text-slate-500">{isLoading ? 'Cargando evento…' : evento?.nombre}</p></div>
      </header>
      {isLoading ? <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div> : isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error instanceof Error ? error.message : 'No se pudo cargar el evento.'}</div> : evento ? (
        <>
          <Card className="max-w-2xl p-6"><div className="space-y-4"><div><h2 className="text-lg font-semibold text-slate-900">{evento.nombre}</h2><p className="mt-1 text-sm text-slate-500">{evento.descripcion ?? 'Sin descripción.'}</p></div><div className="grid gap-3 sm:grid-cols-3"><div><span className="text-xs text-slate-500">Precio unitario</span><p className="font-semibold">${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p></div><div><span className="text-xs text-slate-500">Disponibles</span><p className="font-semibold">{maxCantidad}</p></div><div><span className="text-xs text-slate-500">Total</span><p className="font-semibold text-brand-700">${(cantidad * precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p></div></div><div className="flex flex-wrap items-end gap-4"><div className="w-40"><Input id="cantidad" label="Cantidad" type="number" min={1} max={maxCantidad} value={cantidad} onChange={(event) => setCantidad(Math.min(maxCantidad, Math.max(1, Number(event.target.value))))} /></div><Button onClick={() => setModalAbierto(true)} disabled={!ventaHabilitada || maxCantidad < 1}><Ticket size={16} /> Comprar entradas</Button></div>{!ventaHabilitada && <p className="text-sm text-amber-700">La venta no está habilitada para este evento.</p>}</div></Card>
          <MockPasarelaEntradasModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} cantidad={cantidad} precioUnitario={precio} onConfirmPago={confirmarPago} isLoading={comprar.isPending} />
          {entradas.length > 0 && <section><h2 className="mb-3 text-lg font-semibold text-slate-900">Entradas adquiridas</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{entradas.map((entrada, index) => <Card key={entrada.id} className="flex flex-col items-center p-5 text-center"><p className="mb-2 text-sm font-medium text-slate-500">Entrada #{index + 1}</p><QRCode value={entrada.token} size={160} /><p className="mt-3 break-all font-mono text-xs text-slate-500">{entrada.token}</p></Card>)}</div></section>}
        </>
      ) : null}
    </div>
  );
}
