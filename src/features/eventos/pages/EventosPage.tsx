import { Link } from 'react-router-dom';
import { Button, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useEventos } from '../hooks/useEventos';

export function EventosPage() {
  const { data: eventos, isLoading, isError } = useEventos();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná los eventos del club.</p>
        </div>
        <Link to={ROUTES.crearEvento}>
          <Button>Nuevo evento</Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar los eventos.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Entradas disponibles</th>
                <th className="px-4 py-3 font-medium">Entradas vendidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventos?.map((evento) => (
                <tr key={evento.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{evento.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{evento.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{evento.entradasDisponibles}</td>
                  <td className="px-4 py-3 text-slate-600">{evento.entradasVendidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}