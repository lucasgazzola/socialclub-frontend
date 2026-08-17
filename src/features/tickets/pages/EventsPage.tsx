import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useEvents } from '../hooks/useTickets';

export function EventsPage() {
  const navigate = useNavigate();
  const { data: eventos, isLoading, isError, error } = useEvents();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Seleccioná un evento para comprar entradas con código QR.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los eventos.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventos?.map((evento) => (
            <Card key={evento.id} className="flex flex-col p-5">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{evento.name}</h2>
                {evento.description && (
                  <p className="mt-1 text-sm text-slate-500">{evento.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                  <span>
                    <strong className="text-slate-900">{evento.availableTickets}</strong>{' '}
                    disponibles
                  </span>
                  <span>
                    <strong className="text-slate-900">{evento.soldTickets}</strong> vendidas
                  </span>
                </div>
              </div>

              <Button
                className="mt-4 w-full"
                disabled={evento.availableTickets <= 0}
                onClick={() => navigate(ROUTES.buyTickets(evento.id))}
              >
                <Ticket size={16} />
                Comprar entradas
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}