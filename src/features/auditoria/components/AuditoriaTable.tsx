import type { RegistroAuditoria } from '../types';

interface Props {
  registros: RegistroAuditoria[];
}

export function AuditoriaTable({ registros }: Props) {
  if (registros.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        No se encontraron registros de auditoría.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
        <tbody className="divide-y divide-slate-100">
          {registros.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(r.fechaHora).toLocaleString('es-AR')}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {r.accion}
                </span>
              </td>
              <td className="px-4 py-3">{r.entidad}</td>
              <td className="px-4 py-3">{r.idEntidad ?? '—'}</td>
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