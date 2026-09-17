import type { CuotaPendiente } from '../types';
import { Button } from '@/components/ui';
import { CreditCard, CheckSquare, Square } from 'lucide-react';

interface CuotasPendientesListProps {
  cuotas: CuotaPendiente[];
  selectedPeriodos: string[];
  onTogglePeriodo: (periodo: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPagar: () => void;
}

export function CuotasPendientesList({
  cuotas,
  selectedPeriodos,
  onTogglePeriodo,
  onSelectAll,
  onDeselectAll,
  onPagar,
}: CuotasPendientesListProps) {
  if (cuotas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-slate-800">¡Estás al día con tus cuotas!</h3>
        <p className="mt-1 text-sm text-slate-500">
          No tenés períodos pendientes de pago en este momento.
        </p>
      </div>
    );
  }

  const allSelected = selectedPeriodos.length === cuotas.length;
  const totalSeleccionado = cuotas
    .filter((c) => selectedPeriodos.includes(c.periodo))
    .reduce((sum, c) => sum + c.monto, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 text-slate-700"
          >
            {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
            {allSelected ? 'Desmarcar todas' : 'Seleccionar todas'}
          </Button>
          <span className="text-xs text-slate-500">
            ({selectedPeriodos.length} de {cuotas.length} seleccionadas)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-xs text-slate-500 font-medium">Total a abonar</span>
            <span className="text-xl font-bold text-slate-900">
              ${totalSeleccionado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            type="button"
            disabled={selectedPeriodos.length === 0}
            onClick={onPagar}
            className="flex items-center gap-2"
          >
            <CreditCard size={18} />
            Pagar seleccionadas ({selectedPeriodos.length})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-12 text-center"></th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map((cuota) => {
              const isSelected = selectedPeriodos.includes(cuota.periodo);
              return (
                <tr
                  key={cuota.periodo}
                  onClick={() => onTogglePeriodo(cuota.periodo)}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-brand-50/50 font-medium' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onTogglePeriodo(cuota.periodo)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{cuota.periodo}</td>
                  <td className="px-4 py-3 text-slate-600">Cuota Social - {cuota.categoriaNombre}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ${cuota.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
