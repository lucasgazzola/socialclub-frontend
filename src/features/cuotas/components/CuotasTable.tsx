import { Pencil } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { ConfiguracionCuotaDeportiva } from '../types';

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

/** "2026-09" → "09/2026". */
const formatoPeriodo = (periodo: string) => periodo.split('-').reverse().join('/');

interface CuotasTableProps {
  cuotas: ConfiguracionCuotaDeportiva[];
  onEditar: (cuota: ConfiguracionCuotaDeportiva) => void;
}

/** US-20 · TASK-33 — Tarifas de la cuota deportiva (componente "tonto"). */
export function CuotasTable({ cuotas, onEditar }: CuotasTableProps) {
  if (cuotas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No se encontraron tarifas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Disciplina</th>
              <th className="px-5 py-3.5">Categoría</th>
              <th className="px-5 py-3.5">Rige desde</th>
              <th className="px-5 py-3.5 text-right">Monto</th>
              <th className="px-5 py-3.5 text-right">Descuento socios</th>
              <th className="px-5 py-3.5 text-right">Monto socio</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map((cuota) => (
              <tr key={cuota.id} className="transition-colors hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">{cuota.disciplina.nombre}</td>
                <td className="px-5 py-3.5">
                  {cuota.categoriaDisciplina ? (
                    <span className="inline-flex whitespace-nowrap rounded-md bg-brand-100/70 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {cuota.categoriaDisciplina.nombre}
                    </span>
                  ) : (
                    <span className="text-slate-500">Tarifa base</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{formatoPeriodo(cuota.periodoAplicacion)}</td>
                <td className="px-5 py-3.5 text-right font-medium tabular-nums text-slate-900">
                  {formatoMoneda.format(cuota.monto)}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">
                  {cuota.descuentoSocioPorcentaje > 0 ? `${cuota.descuentoSocioPorcentaje} %` : '—'}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-slate-600">
                  {formatoMoneda.format(Math.round(cuota.monto * (100 - cuota.descuentoSocioPorcentaje)) / 100)}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={cuota.activo ? 'success' : 'secondary'}>{cuota.activo ? 'Activa' : 'Inactiva'}</Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
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
    </div>
  );
}
