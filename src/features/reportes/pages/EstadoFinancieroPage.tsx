import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Card, Select, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import { useEstadoFinanciero } from '../hooks/useEstadoFinanciero';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { GraficoRecaudacionMensual } from '../components/GraficoRecaudacionMensual';
import { describirRango, type Rango } from '../periodo';
import type { ConceptoCuota, Indicadores } from '../types';

const pesos = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
const porcentaje = (p: number | null) =>
  p === null ? '—' : `${p.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;

const CONCEPTO: Record<ConceptoCuota, { etiqueta: string; morosos: string }> = {
  CUOTA_SOCIAL: { etiqueta: 'Cuota social', morosos: ROUTES.morososCuotaSocial },
  CUOTA_DEPORTIVA: { etiqueta: 'Cuota deportiva', morosos: ROUTES.morososCuotaDeportiva },
};

function Indicador({
  titulo,
  valor,
  detalle,
  testId,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  testId: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium tracking-wider text-slate-500 uppercase">{titulo}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums" data-testid={testId}>
        {valor}
      </div>
      {detalle && <div className="mt-1 text-xs text-slate-500">{detalle}</div>}
    </Card>
  );
}

/** Barra de cobranza: proporción cobrada de lo exigible (con su número al lado). */
function BarraCobranza({ porcentajeCobranza }: Pick<Indicadores, 'porcentajeCobranza'>) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-[#2a78d6]"
          style={{ width: `${porcentajeCobranza ?? 0}%` }}
        />
      </div>
      <span className="text-slate-700 tabular-nums">{porcentaje(porcentajeCobranza)}</span>
    </div>
  );
}

/**
 * US-35 — Estado financiero: recaudación y morosidad del club en un período,
 * con filtro por disciplina. Se calcula sobre las cuotas de los meses
 * elegidos; lo adeudado son las cuotas vencidas (día 10) e impagas.
 */
export function EstadoFinancieroPage() {
  const [rango, setRango] = useState<Rango | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const { disciplinas } = useDisciplinasActivas();

  const filtros = { desde: rango?.desde ?? '', hasta: rango?.hasta ?? '', disciplinaId };
  const { data, isLoading, isError, error } = useEstadoFinanciero(filtros, Boolean(rango));
  const disciplinaElegida = disciplinas.find((d) => d.id === disciplinaId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Estado financiero</h1>
        <p className="mt-1 text-sm text-slate-500">
          Recaudación y morosidad de las cuotas del período. Lo adeudado son las cuotas vencidas (el
          día {data?.diaVencimiento ?? 10} de cada mes) que todavía no se pagaron.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <SelectorPeriodo onChange={setRango} />
        <div className="w-full lg:w-56">
          <Select
            id="reporte-disciplina"
            aria-label="Filtrar por disciplina"
            value={disciplinaId ? String(disciplinaId) : ''}
            onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todo el club</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {rango && (
        <p className="text-sm text-slate-600" data-testid="descripcion-reporte">
          <span className="font-semibold text-slate-800">{describirRango(rango)}</span>
          {disciplinaElegida
            ? ` · solo cuota deportiva de ${disciplinaElegida.nombre}`
            : ' · cuota social y cuotas deportivas de todo el club'}
        </p>
      )}

      {!rango ? null : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="text-brand-600 h-8 w-8" />
        </div>
      ) : isError || !data ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          No se pudo generar el reporte:{' '}
          {error instanceof Error ? error.message : 'error desconocido'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              titulo="Total recaudado"
              valor={pesos(data.totales.recaudado)}
              detalle={`Ingresado en el período por fecha de cobro: ${pesos(data.totales.ingresadoPorFechaDeCobro)}`}
              testId="total-recaudado"
            />
            <Indicador
              titulo="Total adeudado"
              valor={pesos(data.totales.adeudado)}
              detalle="Cuotas vencidas sin pagar"
              testId="total-adeudado"
            />
            <Indicador
              titulo="Morosos"
              valor={String(data.totales.morosos)}
              detalle="Personas con al menos una cuota adeudada"
              testId="total-morosos"
            />
            <Indicador
              titulo="Porcentaje de cobranza"
              valor={porcentaje(data.totales.porcentajeCobranza)}
              detalle="Recaudado sobre lo exigible del período"
              testId="porcentaje-cobranza"
            />
          </div>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Por concepto</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Estado por concepto">
                <thead className="text-xs tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="py-2 font-medium">Concepto</th>
                    <th className="py-2 text-right font-medium">Recaudado</th>
                    <th className="py-2 text-right font-medium">Adeudado</th>
                    <th className="py-2 text-right font-medium">Morosos</th>
                    <th className="py-2 pl-6 font-medium">Cobranza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.porConcepto.map((c) => (
                    <tr key={c.concepto}>
                      <td className="py-2.5 font-medium text-slate-800">
                        {CONCEPTO[c.concepto].etiqueta}
                      </td>
                      <td className="py-2.5 text-right text-slate-700 tabular-nums">
                        {pesos(c.recaudado)}
                      </td>
                      <td className="py-2.5 text-right text-slate-700 tabular-nums">
                        {pesos(c.adeudado)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to={CONCEPTO[c.concepto].morosos}
                          className="text-brand-600 inline-flex items-center gap-0.5 font-medium tabular-nums hover:underline"
                          aria-label={`Ver morosos de ${CONCEPTO[c.concepto].etiqueta.toLowerCase()} (${c.morosos})`}
                        >
                          {c.morosos}
                          <ArrowUpRight size={12} />
                        </Link>
                      </td>
                      <td className="py-2.5 pl-6">
                        <BarraCobranza porcentajeCobranza={c.porcentajeCobranza} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Por mes</h2>
            <GraficoRecaudacionMensual porMes={data.porMes} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Cuota deportiva por disciplina
            </h2>
            {data.porDisciplina.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay cuotas deportivas cobradas ni adeudadas en el período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left text-sm"
                  aria-label="Cuota deportiva por disciplina"
                >
                  <thead className="text-xs tracking-wider text-slate-400 uppercase">
                    <tr>
                      <th className="py-2 font-medium">Disciplina</th>
                      <th className="py-2 text-right font-medium">Recaudado</th>
                      <th className="py-2 text-right font-medium">Adeudado</th>
                      <th className="py-2 text-right font-medium">Morosos</th>
                      <th className="py-2 pl-6 font-medium">Cobranza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.porDisciplina.map((d) => (
                      <tr key={d.disciplinaId}>
                        <td className="py-2.5 font-medium text-slate-800">{d.disciplinaNombre}</td>
                        <td className="py-2.5 text-right text-slate-700 tabular-nums">
                          {pesos(d.recaudado)}
                        </td>
                        <td className="py-2.5 text-right text-slate-700 tabular-nums">
                          {pesos(d.adeudado)}
                        </td>
                        <td className="py-2.5 text-right text-slate-700 tabular-nums">
                          {d.morosos}
                        </td>
                        <td className="py-2.5 pl-6">
                          <BarraCobranza porcentajeCobranza={d.porcentajeCobranza} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
