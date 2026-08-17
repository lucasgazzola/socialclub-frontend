import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Ticket as TicketIcon } from 'lucide-react';
import { Button, Card, Input, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useCreateTickets, useEvent } from '../hooks/useTickets';
import { QRCode } from '../components/QRCode';
import type { Ticket } from '../types';

export function BuyTicketsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = Number(eventId); // Convierte el ID a numero para usarlo en las queries y mutaciones
  const navigate = useNavigate(); // Para volver a la pagina de eventos despues de generar las entradas

  const { data: evento, isLoading, isError, error } = useEvent(id); //Trae los datos del evento
  /**
   * Hook-Mutacion para crear entradas.
   * mutateAsync es la funcion para ejecutar la mutacion de crear entradas.
   */
  const { mutateAsync, isPending, error: errorCrear } = useCreateTickets(); // Hook-Mutacion para crear entradas

  const [quantity, setCantidad] = useState(1); // Estado para la quantity de entradas a generar, inicialmente es 1
  
  /**
   * Estado que guarda las entradas generadas despues de la mutacion. 
   * Cada entrada se renderiza con un QR.
   */
  const [entradasGeneradas, setEntradasGeneradas] = useState<Ticket[]>([]);
  
  /**
   * Estado que guarda el nombre del evento al que pertenencen las entradas generadas.
   */
  const [eventName, setEventoNombre] = useState('');

  /**
   * Calcula la quantity maxima de entradas disponibles para el evento.
   * Si no hay evento, se asume 1.
   */
  const maxCantidad = evento?.availableTickets ?? 1; 
  
  /**
   * Ejecuta el Hook y devuelve las entradas generadas por el backend.
   * Tambien actualiza el estado de entradasGeneradas y eventName para renderizar los QR.
   */
  const handleGenerar = async () => {
    const resultado = await mutateAsync({ eventId: id, quantity });
    setEntradasGeneradas(resultado.entradas);
    setEventoNombre(resultado.eventName);
  };

  /** 
   * Genera un QR para la entrada y lo descarga como imagen PNG.
  */
  const descargarQR = (entrada: Ticket) => {
    void import('qrcode').then(({ default: QRCodeLib }) => {
      void QRCodeLib.toDataURL(entrada.token, { width: 300, margin: 2 }).then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `entrada-${entrada.token.slice(0, 8)}.png`;
        link.click();
      });
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.events)}>
          <ArrowLeft size={24} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Comprar entradas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading ? 'Cargando evento…' : evento?.name}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudo cargar el evento.'}
        </div>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <Input
                  id="quantity"
                  label="Cantidad de entradas"
                  type="number"
                  min={1}
                  max={maxCantidad}
                  value={quantity}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="pb-1 text-sm text-slate-500">
                Disponibles: <strong className="text-slate-900">{maxCantidad}</strong>
              </div>
              <Button
                onClick={() => void handleGenerar()}
                disabled={isPending || maxCantidad <= 0}
                className="whitespace-nowrap"
              >
                <TicketIcon size={16} />
                {isPending ? 'Generando…' : 'Generar entradas'}
              </Button>
            </div>

            {errorCrear && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorCrear instanceof Error ? errorCrear.message : 'Error al generar entradas.'}
              </div>
            )}
          </Card>

          {entradasGeneradas.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                {entradasGeneradas.length} entrada(s) generada(s) para {eventName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entradasGeneradas.map((entrada, index) => (
                  <Card key={entrada.id} className="flex flex-col items-center p-5 text-center">
                    <p className="mb-2 text-sm font-medium text-slate-500">Entrada #{index + 1}</p>
                    <QRCode value={entrada.token} size={160} />
                    <p className="mt-3 break-all font-mono text-xs text-slate-500">
                      {entrada.token}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => descargarQR(entrada)}
                    >
                      <Download size={14} />
                      Descargar QR
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}