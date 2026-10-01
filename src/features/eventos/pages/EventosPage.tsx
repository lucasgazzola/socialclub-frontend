import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Ticket } from 'lucide-react';
import { Button, Modal, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { EventoForm } from '../components/EventoForm';
import { useCrearEvento, useEventos } from '../hooks/useEventos';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function EventosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { data: eventos, isLoading, isError } = useEventos();
  const crearEvento = useCrearEvento();
  const { usuario } = useAuth();
  const puedeCrearEvento = usuario?.roles.includes('ADMIN') ?? false;

  async function handleCrear(data: Parameters<typeof crearEvento.mutateAsync>[0]) {
    await crearEvento.mutateAsync(data);
    setModalAbierto(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná los eventos del club.</p>
        </div>
        {puedeCrearEvento && (
          <Button onClick={() => setModalAbierto(true)} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} />
            Nuevo evento
          </Button>
        )}
      </header>

      <Modal
        open={modalAbierto}
        title="Nuevo evento"
        description="Completá los datos para crear un nuevo evento."
        onClose={() => setModalAbierto(false)}
      >
        <EventoForm onSubmit={handleCrear} submitLabel="Crear evento" />
      </Modal>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar los eventos.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Nombre</th>
                <th className="px-5 py-3.5">Descripción</th>
                <th className="px-5 py-3.5">Entradas disponibles</th>
                <th className="px-5 py-3.5">Entradas vendidas</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventos?.map((evento) => (
                <tr key={evento.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{evento.nombre}</td>
                  <td className="px-5 py-3.5 text-slate-600">{evento.descripcion ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600">{evento.entradasDisponibles}</td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600">{evento.entradasVendidas}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={ROUTES.comprarEntradas(evento.id)}>
                      <Button
                        size="sm"
                        variant={evento.entradasDisponibles > 0 ? 'secondary' : 'ghost'}
                        disabled={evento.entradasDisponibles <= 0}
                      >
                        <Ticket size={14} className="mr-1.5" />
                        Comprar entradas
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
