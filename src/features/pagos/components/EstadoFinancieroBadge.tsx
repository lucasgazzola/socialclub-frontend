import type { EstadoFinancieroSocio } from '../types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface EstadoFinancieroBadgeProps {
  estado: EstadoFinancieroSocio;
  cuotasPendientesCount?: number;
}

export function EstadoFinancieroBadge({
  estado,
  cuotasPendientesCount = 0,
}: EstadoFinancieroBadgeProps) {
  if (estado === 'AL_DIA') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold">
        <CheckCircle2 size={18} className="text-emerald-600" />
        <span>Al día</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-sm font-semibold">
      <AlertTriangle size={18} className="text-amber-600" />
      <span>
        Moroso ({cuotasPendientesCount}{' '}
        {cuotasPendientesCount === 1 ? 'cuota adeudada' : 'cuotas adeudadas'})
      </span>
    </div>
  );
}
