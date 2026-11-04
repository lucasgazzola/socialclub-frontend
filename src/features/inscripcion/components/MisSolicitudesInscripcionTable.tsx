import { CalendarClock } from 'lucide-react';
import { EstadoSolicitudBadge } from './EstadoSolicitudBadge';
import type { SolicitudInscripcion } from '../types';

interface Props {
  solicitudes: SolicitudInscripcion[];
}

export function MisSolicitudesInscripcionTable({ solicitudes }: Props) {
  if (solicitudes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs" data-testid="sin-solicitudes">
        <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">Todavía no enviaste ninguna solicitud de inscripción.</p>
        <p className="mt-1 text-sm text-slate-500">
          Explorá el catálogo de disciplinas activas para postularte a las actividades del club.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm text-slate-600" data-testid="tabla-mis-solicitudes">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <tr>
            <th className="px-4 py-3">Disciplina</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Fecha y hora</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Detalle / Motivo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map((s) => {
            const fecha = new Date(s.fechaSolicitud);
            const fechaFormateada = fecha.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <tr
                key={s.id}
                className="align-middle transition-colors hover:bg-slate-50"
                data-testid={`fila-solicitud-${s.id}`}
              >
                <td className="px-4 py-3 font-semibold text-slate-900">{s.disciplina.nombre}</td>
                <td className="px-4 py-3 text-slate-700">
                  {s.categoriaDisciplina?.nombre ?? 'General'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{fechaFormateada}</td>
                <td className="px-4 py-3">
                  <EstadoSolicitudBadge estado={s.estado} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {s.motivoRechazo ? (
                    <span className="text-rose-600 font-medium">{s.motivoRechazo}</span>
                  ) : s.estado === 'PENDIENTE' ? (
                    'En revisión por la administración'
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

