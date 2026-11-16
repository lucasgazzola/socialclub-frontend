import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { formatearDni } from '@/lib/utils/dni';
import { ROUTES } from '@/routes/paths';
import type { MorosoCuotaDeportiva } from '../types';
import type { SentidoOrdenMorosos } from './MorososCuotaSocialTable';

export type CriterioOrdenMorososDeportiva = 'nombre' | 'dni' | 'monto' | 'periodos';

interface MorososCuotaDeportivaTableProps {
  morosos: MorosoCuotaDeportiva[];
  onCobrar: (moroso: MorosoCuotaDeportiva) => void;
  ordenarPor?: CriterioOrdenMorososDeportiva;
  orden?: SentidoOrdenMorosos;
  onOrdenar?: (campo: CriterioOrdenMorososDeportiva) => void;
}

interface ColumnaOrdenableProps {
  campo: CriterioOrdenMorososDeportiva;
  label: string;
  ordenarPor?: CriterioOrdenMorososDeportiva;
  orden?: SentidoOrdenMorosos;
  onOrdenar?: (campo: CriterioOrdenMorososDeportiva) => void;
  align?: 'left' | 'right';
}

function ColumnaOrdenable({
  campo,
  label,
  ordenarPor,
  orden,
  onOrdenar,
  align = 'left',
}: ColumnaOrdenableProps) {
  const activo = ordenarPor === campo && Boolean(orden);
  return (
    <th
      scope="col"
      aria-sort={activo ? (orden === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-6 py-3.5', align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onOrdenar?.(campo)}
        title={`Ordenar por ${label}`}
        className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors select-none focus:outline-hidden cursor-pointer"
      >
        <span>{label}</span>
        <span className="flex items-center" aria-hidden="true">
          {activo ? (
            orden === 'asc' ? (
              <ArrowUp size={13} className="text-brand-600 stroke-[2.5]" />
            ) : (
              <ArrowDown size={13} className="text-brand-600 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown
              size={13}
              className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          )}
        </span>
      </button>
    </th>
  );
}

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

/**
 * US-23 — Listado de morosos de cuota deportiva. Cada fila muestra la deuda de
 * cada disciplina por separado y se despliega para ver el detalle de las
 * cuotas vencidas (período, vencimiento, importe y estado).
 */
export function MorososCuotaDeportivaTable({
  morosos,
  onCobrar,
  ordenarPor,
  orden,
  onOrdenar,
}: MorososCuotaDeportivaTableProps) {
  const navigate = useNavigate();

  if (morosos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <AlertCircle size={24} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-800">
          No se registran morosos de cuota deportiva
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Nadie tiene cuotas vencidas sin pagar, o no hay coincidencias con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <tr>
              <ColumnaOrdenable
                campo="nombre"
                label="Participante"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <ColumnaOrdenable
                campo="dni"
                label="DNI"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <ColumnaOrdenable
                campo="periodos"
                label="Períodos"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
              />
              <ColumnaOrdenable
                campo="monto"
                label="Deuda total"
                ordenarPor={ordenarPor}
                orden={orden}
                onOrdenar={onOrdenar}
                align="right"
              />
              <th scope="col" className="px-6 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {morosos.map((moroso) => (
              <tr key={moroso.personaId} className="transition-colors hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{moroso.nombreCompleto}</div>
                  <div className="text-xs text-slate-400">
                    {moroso.email || moroso.telefono || 'Sin datos de contacto'}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-600">{formatearDni(moroso.dni)}</td>
                <td className="px-6 py-4 tabular-nums">{moroso.cantidadPeriodos}</td>
                <td className="px-6 py-4 text-right font-semibold text-rose-600 tabular-nums">
                  {formatMonto(moroso.montoTotalDeuda)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Ver historial de ${moroso.nombreCompleto}`}
                      onClick={() => navigate(ROUTES.historialCuotaDeportivaDe(moroso.personaId))}
                    >
                      <Eye size={14} />
                      Detalle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCobrar(moroso)}
                      title="Registrar el cobro de las cuotas adeudadas"
                    >
                      <CreditCard size={14} className="text-brand-600" />
                      Cobrar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
