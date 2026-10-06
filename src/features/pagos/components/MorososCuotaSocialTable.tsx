import { useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { SocioMorosoCuotaSocial } from '../types';

interface MorososCuotaSocialTableProps {
  morosos: SocioMorosoCuotaSocial[];
  onCobrar: (socio: { id: number; nombre: string; apellido: string; dni?: string }) => void;
}

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function MorososCuotaSocialTable({ morosos, onCobrar }: MorososCuotaSocialTableProps) {
  // Manejo de despliegue de períodos cuando son más de 3
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (morosos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <AlertCircle size={24} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-800">
          No se registran morosos de cuota social
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Todos los socios se encuentran al día con sus pagos o no hay coincidencias con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Socio
              </th>
              <th scope="col" className="px-6 py-3.5">
                DNI
              </th>
              <th scope="col" className="px-6 py-3.5">
                Categoría
              </th>
              <th scope="col" className="px-6 py-3.5">
                Períodos adeudados
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Deuda total
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {morosos.map((socio) => {
              const estaExpandido = Boolean(expandidos[socio.personaId]);
              const periodosMostrados = estaExpandido
                ? socio.periodosAdeudados
                : socio.periodosAdeudados.slice(0, 3);
              const hayMas = socio.periodosAdeudados.length > 3;

              return (
                <tr
                  key={socio.personaId}
                  className="transition-colors hover:bg-slate-50/60"
                  data-testid={`moroso-row-${socio.personaId}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{socio.nombreCompleto}</div>
                    <div className="text-xs text-slate-400">
                      {socio.email || socio.telefono || 'Sin datos de contacto'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{socio.dni}</td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{socio.categoria}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {periodosMostrados.map((periodo) => (
                        <span
                          key={periodo}
                          className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20"
                        >
                          {periodo}
                        </span>
                      ))}
                      {hayMas && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(socio.personaId)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          {estaExpandido
                            ? 'Ver menos'
                            : `+${socio.periodosAdeudados.length - 3} más`}
                        </button>
                      )}
                    </div>
                    <span className="mt-1 block text-xs text-slate-400">
                      {socio.cantidadPeriodos}{' '}
                      {socio.cantidadPeriodos === 1 ? 'período atrasado' : 'períodos atrasados'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-rose-600">
                    {formatMonto(socio.montoTotalDeuda)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onCobrar({
                          id: socio.personaId,
                          nombre: socio.nombre,
                          apellido: socio.apellido,
                          dni: socio.dni,
                        })
                      }
                      title="Registrar cobro de cuotas adeudadas"
                    >
                      <CreditCard size={14} className="mr-1 text-brand-600" />
                      Cobrar
                    </Button>
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

