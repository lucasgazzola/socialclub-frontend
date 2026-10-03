import type { RegistroAuditoria } from '../types';
import type { AccionAuditoria } from '../constants';

interface Props {
  registros: RegistroAuditoria[];
  isFetching?: boolean;
}

/** Paleta de colores semánticos por tipo de acción */
const ACCION_BADGE: Record<AccionAuditoria, string> = {
  CREAR: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  EDITAR: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  BAJA: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
  REACTIVAR: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  LOGIN: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
  LOGOUT: 'bg-slate-100 text-slate-500 ring-1 ring-slate-400/20',
  LOGIN_FALLIDO: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
};

export function AuditoriaTable({ registros, isFetching }: Props) {
  if (registros.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        No se encontraron registros de auditoría.
      </p>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-slate-200 transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}
    >
      <table className="w-full text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Fecha y hora</th>
            <th className="px-4 py-3 text-left">Acción</th>
            <th className="px-4 py-3 text-left">Entidad</th>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Responsable</th>
            <th className="px-4 py-3 text-left">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr
              key={r.id}
              className="border-b border-slate-100 last:border-b-0 transition-[background-color] duration-150 hover:bg-slate-50"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(r.fechaHora).toLocaleString('es-AR')}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACCION_BADGE[r.accion] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {r.accion}
                </span>
              </td>
              <td className="px-4 py-3">{r.entidad}</td>
              <td className="px-4 py-3 text-slate-400">{r.idEntidad ?? '—'}</td>
              <td className="px-4 py-3">
                {r.responsable
                  ? `${r.responsable.nombre} ${r.responsable.apellido}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-slate-400">{r.detalle ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}