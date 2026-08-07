import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import type { ConfiguracionCuotaDeportiva } from '../types';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

interface CuotasTableProps {
  cuotas: ConfiguracionCuotaDeportiva[];
  onEditar: (cuota: ConfiguracionCuotaDeportiva) => void;
}

/** Tabla de configuraciones de cuota deportiva (componente "tonto"). */
export function CuotasTable({ cuotas, onEditar }: CuotasTableProps) {
  if (cuotas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No se encontraron configuraciones de cuota.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Disciplina</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Período</th>
            <th className="px-4 py-3 font-medium">Monto</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cuotas.map((cuota) => (
            <tr key={cuota.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">{cuota.disciplina.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{cuota.categoria.nombre}</td>
              <td className="px-4 py-3 text-slate-600">{cuota.periodoAplicacion}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {formatoMoneda.format(cuota.monto)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    cuota.activo
                      ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                      : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
                  }
                >
                  {cuota.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3">
                <Button variant="ghost" size="sm" onClick={() => onEditar(cuota)}>
                  <Pencil size={14} />
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
