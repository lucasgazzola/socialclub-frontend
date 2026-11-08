import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type { DashboardEvento } from '../types/dashboard.types';
import { formatearFechaHoraEvento } from '../utils/dashboard.utils';

interface DashboardProximosEventosProps {
  eventos: DashboardEvento[];
}

export function DashboardProximosEventos({ eventos }: DashboardProximosEventosProps) {
  return (
    <section aria-labelledby="proximos-eventos-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="proximos-eventos-heading"
          className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase"
        >
          <CalendarDays className="text-brand-600 size-3.5" />
          Próximos Eventos
        </h2>
        <Link
          to={ROUTES.eventos}
          className="text-brand-700 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
        >
          Ver todos
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {eventos.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No hay eventos próximos programados o publicados en la organización
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Nombre del Evento</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Fecha y Hora</th>
                  <th className="px-5 py-3.5">Lugar de Acreditación</th>
                  <th className="px-5 py-3.5 text-right">Entradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventos.map((evento) => {
                  const tieneCupo =
                    evento.capacidadMaxima !== null && evento.entradasDisponibles !== null;
                  const agotado = tieneCupo && evento.entradasDisponibles === 0;

                  return (
                    <tr key={evento.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{evento.nombre}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                        {formatearFechaHoraEvento(evento.fechaEvento)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0 text-slate-400" />
                          {evento.lugarAcreditacion}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {tieneCupo ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <span className="text-xs font-medium text-slate-700">
                              <Ticket className="mr-1 inline size-3.5 text-slate-400" />
                              {evento.entradasVendidas} / {evento.capacidadMaxima} vendidas
                            </span>
                            <Badge variant={agotado ? 'danger' : 'success'}>
                              {agotado ? 'Agotadas' : `${evento.entradasDisponibles} disponibles`}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary">Sin límite de cupo</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
