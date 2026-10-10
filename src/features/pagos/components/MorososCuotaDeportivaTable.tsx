import { Fragment, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, CreditCard } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { isoADisplay } from '@/lib/utils/fecha';
import type { MorosoCuotaDeportiva } from '../types';

interface MorososCuotaDeportivaTableProps {
  morosos: MorosoCuotaDeportiva[];
  onCobrar: (moroso: MorosoCuotaDeportiva) => void;
}

/**
 * Disciplinas que se muestran en la fila; el resto se ve en el detalle. Así la
 * fila no crece con quien debe en muchas disciplinas.
 */
const DISCIPLINAS_VISIBLES = 2;

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

/** "2026-09" → "09/2026". */
function formatPeriodo(periodo: string): string {
  return periodo.split('-').reverse().join('/');
}

/**
 * US-23 — Listado de morosos de cuota deportiva. Cada fila muestra la deuda de
 * cada disciplina por separado y se despliega para ver el detalle de las
 * cuotas vencidas (período, vencimiento, importe y estado).
 */
export function MorososCuotaDeportivaTable({ morosos, onCobrar }: MorososCuotaDeportivaTableProps) {
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>({});

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
              <th scope="col" className="px-6 py-3.5">
                Participante
              </th>
              <th scope="col" className="px-6 py-3.5">
                DNI
              </th>
              <th scope="col" className="px-6 py-3.5">
                Deuda por disciplina
              </th>
              <th scope="col" className="px-6 py-3.5">
                Períodos
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
            {morosos.map((moroso) => {
              const abierto = Boolean(abiertos[moroso.personaId]);
              return (
                <Fragment key={moroso.personaId}>
                  <tr className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{moroso.nombreCompleto}</div>
                      <div className="text-xs text-slate-400">
                        {moroso.email || moroso.telefono || 'Sin datos de contacto'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{moroso.dni}</td>
                    <td className="px-6 py-4">
                      <ul className="space-y-1">
                        {moroso.disciplinas.slice(0, DISCIPLINAS_VISIBLES).map((d) => (
                          <li key={d.disciplinaId}>
                            <span className="font-medium text-slate-800">{d.disciplinaNombre}</span>
                            <span className="text-xs text-slate-500">
                              {' '}
                              · {d.cantidadPeriodos} per. · {formatMonto(d.montoAdeudado)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {moroso.disciplinas.length > DISCIPLINAS_VISIBLES && !abierto && (
                        <button
                          type="button"
                          onClick={() =>
                            setAbiertos((prev) => ({ ...prev, [moroso.personaId]: true }))
                          }
                          className="text-brand-600 hover:text-brand-700 mt-1 text-xs font-semibold hover:underline"
                        >
                          +{moroso.disciplinas.length - DISCIPLINAS_VISIBLES}{' '}
                          {moroso.disciplinas.length - DISCIPLINAS_VISIBLES === 1
                            ? 'disciplina más'
                            : 'disciplinas más'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 tabular-nums">{moroso.cantidadPeriodos}</td>
                    <td className="px-6 py-4 text-right font-semibold text-rose-600 tabular-nums">
                      {formatMonto(moroso.montoTotalDeuda)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-expanded={abierto}
                          aria-label={`${abierto ? 'Ocultar' : 'Ver'} detalle de ${moroso.nombreCompleto}`}
                          onClick={() =>
                            setAbiertos((prev) => ({ ...prev, [moroso.personaId]: !abierto }))
                          }
                        >
                          {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                  {abierto && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="px-6 pt-1 pb-5">
                        <div className="grid gap-4 lg:grid-cols-2">
                          {moroso.disciplinas.map((d) => (
                            <section
                              key={d.disciplinaId}
                              aria-label={`Cuotas adeudadas de ${d.disciplinaNombre}`}
                              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                            >
                              <h4 className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                                {d.disciplinaNombre}
                                {d.categoriaNombre && (
                                  <span className="font-normal text-slate-400">
                                    {' '}
                                    · {d.categoriaNombre}
                                  </span>
                                )}
                                {!d.inscripcionActiva && (
                                  <Badge variant="secondary">Dada de baja</Badge>
                                )}
                              </h4>
                              <table className="w-full text-sm">
                                <thead className="text-xs tracking-wider text-slate-400 uppercase">
                                  <tr>
                                    <th className="px-4 py-2 font-medium">Período</th>
                                    <th className="px-4 py-2 font-medium">Vencimiento</th>
                                    <th className="px-4 py-2 text-right font-medium">Importe</th>
                                    <th className="px-4 py-2 text-right font-medium">Estado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {d.cuotas.map((c) => (
                                    <tr key={c.periodo}>
                                      <td className="px-4 py-2 font-medium text-slate-700">
                                        {formatPeriodo(c.periodo)}
                                      </td>
                                      <td className="px-4 py-2 text-slate-500">
                                        {isoADisplay(c.fechaVencimiento)}
                                      </td>
                                      <td className="px-4 py-2 text-right text-slate-700 tabular-nums">
                                        {formatMonto(c.monto)}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        <Badge variant="danger">Vencida · impaga</Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </section>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
