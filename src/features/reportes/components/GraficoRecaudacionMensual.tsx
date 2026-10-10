import { useState } from 'react';
import { mesCorto, nombreDelMes } from '../periodo';
import type { EstadoFinanciero } from '../types';

/**
 * US-35 — Recaudado y adeudado de cada mes, en barras apiladas: la altura es
 * lo exigible del mes y la proporción azul es lo cobrado. Paleta validada
 * (skill dataviz: slots 1 y 2, todos los controles en claro). Tooltip al pasar
 * el mouse y tabla con los mismos datos para quien no lee el gráfico.
 */
const COLOR = { recaudado: '#2a78d6', adeudado: '#eb6834' };
const ALTO = 200;

const pesos = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function escalaMaxima(max: number): number {
  if (max <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(max));
  const paso = [1, 2, 2.5, 5, 10].find((p) => p * potencia >= max / 2) ?? 10;
  return Math.ceil(max / (paso * potencia)) * paso * potencia;
}

export function GraficoRecaudacionMensual({ porMes }: { porMes: EstadoFinanciero['porMes'] }) {
  const [activo, setActivo] = useState<string | null>(null);
  const tope = escalaMaxima(Math.max(0, ...porMes.map((m) => m.recaudado + m.adeudado)));
  const lineas = [tope, tope / 2, 0];
  const mesActivo = porMes.find((m) => m.periodo === activo);

  return (
    <figure className="space-y-3" aria-label="Recaudado y adeudado por mes">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {(['recaudado', 'adeudado'] as const).map((serie) => (
          <span key={serie} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[serie] }} />
            {serie === 'recaudado' ? 'Recaudado' : 'Adeudado (vencido)'}
          </span>
        ))}
      </div>

      <div className="relative flex gap-3">
        <div
          className="flex flex-col justify-between text-right text-[11px] text-slate-400 tabular-nums"
          style={{ height: ALTO }}
          aria-hidden="true"
        >
          {lineas.map((v) => (
            <span key={v} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {pesos(v)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between"
            style={{ height: ALTO }}
          >
            {lineas.map((v) => (
              <div key={v} className="border-t border-slate-100" />
            ))}
          </div>

          <div className="relative flex items-end gap-2" style={{ height: ALTO }}>
            {porMes.map((m) => {
              const hRec = (m.recaudado / tope) * ALTO;
              const hAde = (m.adeudado / tope) * ALTO;
              return (
                <div
                  key={m.periodo}
                  data-testid={`barra-${m.periodo}`}
                  className="flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
                  onMouseEnter={() => setActivo(m.periodo)}
                  onMouseLeave={() => setActivo(null)}
                >
                  <div className="flex w-full max-w-12 flex-col items-stretch justify-end gap-[2px]">
                    {hAde > 0 && (
                      <div
                        className="rounded-t"
                        style={{
                          height: hAde,
                          background: COLOR.adeudado,
                          opacity: activo && activo !== m.periodo ? 0.45 : 1,
                        }}
                      />
                    )}
                    {hRec > 0 && (
                      <div
                        className={hAde > 0 ? '' : 'rounded-t'}
                        style={{
                          height: hRec,
                          background: COLOR.recaudado,
                          opacity: activo && activo !== m.periodo ? 0.45 : 1,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex gap-2 text-[11px] text-slate-500" aria-hidden="true">
            {porMes.map((m) => (
              <span key={m.periodo} className="min-w-0 flex-1 truncate text-center">
                {mesCorto(m.periodo)}
              </span>
            ))}
          </div>

          {mesActivo && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-0 right-0 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            >
              <p className="mb-1 font-semibold text-slate-800 capitalize">
                {nombreDelMes(mesActivo.periodo)}
              </p>
              <p className="text-slate-600">
                Recaudado:{' '}
                <span className="font-medium text-slate-900 tabular-nums">
                  {pesos(mesActivo.recaudado)}
                </span>
              </p>
              <p className="text-slate-600">
                Adeudado:{' '}
                <span className="font-medium text-slate-900 tabular-nums">
                  {pesos(mesActivo.adeudado)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <details className="text-sm">
        <summary className="text-brand-600 cursor-pointer text-xs font-semibold">
          Ver como tabla
        </summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs tracking-wider text-slate-400 uppercase">
            <tr>
              <th className="py-1.5 font-medium">Mes</th>
              <th className="py-1.5 text-right font-medium">Recaudado</th>
              <th className="py-1.5 text-right font-medium">Adeudado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {porMes.map((m) => (
              <tr key={m.periodo}>
                <td className="py-1.5 text-slate-700 capitalize">{nombreDelMes(m.periodo)}</td>
                <td className="py-1.5 text-right text-slate-700 tabular-nums">
                  {pesos(m.recaudado)}
                </td>
                <td className="py-1.5 text-right text-slate-700 tabular-nums">
                  {pesos(m.adeudado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
