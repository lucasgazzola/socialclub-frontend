import { useState } from 'react';
import {
  Users,
  Ticket,
  TrendingUp,
  UserX,
  Download,
  FileText,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Button, Card, Select, Input, Spinner } from '@/components/ui';
import { useAsistenciaEventos } from '../hooks/useAsistenciaEventos';
import { GraficoAsistenciaEventos } from '../components/GraficoAsistenciaEventos';
import {
  exportarAsistenciaCsv,
  exportarAsistenciaPdf,
} from '../utils/exportarReporteAsistencia';
import type { FiltrosAsistenciaEventos } from '../types';

const pesos = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const porcentaje = (p: number | null) =>
  p === null ? '—' : `${p.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;

function IndicadorKpi({
  titulo,
  valor,
  detalle,
  icono: Icono,
  color,
  testId,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: React.ElementType;
  color: string;
  testId: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
          {titulo}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icono size={18} />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums" data-testid={testId}>
        {valor}
      </div>
      {detalle && <div className="mt-1 text-xs text-slate-500">{detalle}</div>}
    </Card>
  );
}

/** Insignia semántica de asistencia. */
function BadgeAsistencia({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-slate-400">—</span>;

  let clases = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (valor < 50) {
    clases = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (valor < 80) {
    clases = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${clases}`}
    >
      {porcentaje(valor)}
    </span>
  );
}

/** Insignia de estado del evento. */
function BadgeEstado({ estado }: { estado: string }) {
  const mapEstado: Record<string, { label: string; clases: string }> = {
    PUBLICADO: { label: 'Publicado', clases: 'bg-blue-50 text-blue-700 border-blue-200' },
    FINALIZADO: { label: 'Finalizado', clases: 'bg-slate-100 text-slate-700 border-slate-200' },
    CANCELADO: { label: 'Cancelado', clases: 'bg-rose-50 text-rose-700 border-rose-200' },
    BORRADOR: { label: 'Borrador', clases: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  const item = mapEstado[estado] ?? { label: estado, clases: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${item.clases}`}>
      {item.label}
    </span>
  );
}

/**
 * US-36 — Reporte de Asistencia y Ocupación de Eventos.
 * Permite filtrar por evento puntual, rango de fechas y estado,
 * visualizando tablero interactivo con KPIs, gráficos y exportación a PDF y CSV.
 */
export function ReporteAsistenciaPage() {
  const [filtros, setFiltros] = useState<FiltrosAsistenciaEventos>({});

  const { data, isLoading, isError, error, refetch } = useAsistenciaEventos(filtros);

  const hayFiltrosActivos = Boolean(
    filtros.eventoId || filtros.desde || filtros.hasta || filtros.estado,
  );

  const handleLimpiarFiltros = () => {
    setFiltros({});
  };

  return (
    <div className="space-y-6">
      {/* Encabezado estricto según ESTANDARES_UI_UX.md */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reporte de asistencia a eventos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Métricas de asistencia, porcentaje de ocupación y ausentismo para la toma de decisiones estratégicas.
          </p>
        </div>

        {/* Acciones de exportación */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => data && exportarAsistenciaCsv(data)}
            disabled={!data || data.eventos.length === 0}
            className="shadow-xs"
            title="Descargar en formato CSV compatible con Excel"
          >
            <Download size={16} />
            Exportar CSV
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => data && exportarAsistenciaPdf(data)}
            disabled={!data || data.eventos.length === 0}
            className="shadow-xs"
            title="Generar y descargar documento oficial en PDF"
          >
            <FileText size={16} />
            Exportar PDF
          </Button>
        </div>
      </header>

      {/* Barra de Filtros interactiva */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Selector de Evento */}
            <div>
              <label htmlFor="filtro-evento" className="mb-1 block text-xs font-medium text-slate-700">
                Evento específico
              </label>
              <Select
                id="filtro-evento"
                aria-label="Filtrar por evento"
                value={filtros.eventoId ? String(filtros.eventoId) : ''}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    eventoId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              >
                <option value="">Todos los eventos</option>
                {data?.eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label htmlFor="filtro-desde" className="mb-1 block text-xs font-medium text-slate-700">
                Fecha desde
              </label>
              <Input
                id="filtro-desde"
                type="date"
                value={filtros.desde ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, desde: e.target.value || undefined }))
                }
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label htmlFor="filtro-hasta" className="mb-1 block text-xs font-medium text-slate-700">
                Fecha hasta
              </label>
              <Input
                id="filtro-hasta"
                type="date"
                value={filtros.hasta ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, hasta: e.target.value || undefined }))
                }
              />
            </div>

            {/* Estado del Evento */}
            <div>
              <label htmlFor="filtro-estado" className="mb-1 block text-xs font-medium text-slate-700">
                Estado
              </label>
              <Select
                id="filtro-estado"
                aria-label="Filtrar por estado"
                value={filtros.estado ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, estado: e.target.value || undefined }))
                }
              >
                <option value="">Todos los estados</option>
                <option value="PUBLICADO">Publicado</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="BORRADOR">Borrador</option>
              </Select>
            </div>
          </div>

          {/* Botón de limpiar filtros */}
          {hayFiltrosActivos && (
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimpiarFiltros}
                className="text-slate-500 hover:text-slate-800"
              >
                <RotateCcw size={14} />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-brand-600 h-8 w-8" />
        </div>
      ) : isError || !data ? (
        <Card className="border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <div className="font-semibold">No se pudo cargar el reporte de asistencia</div>
          <div className="mt-1 text-sm text-rose-600">
            {error instanceof Error ? error.message : 'Error de comunicación con el servidor'}
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-4">
            Reintentar
          </Button>
        </Card>
      ) : (
        <>
          {/* 4 Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IndicadorKpi
              titulo="Asistentes validados"
              valor={data.totales.totalAsistentes.toLocaleString('es-AR')}
              detalle={
                data.totales.porcentajeAsistenciaPromedio !== null
                  ? `${data.totales.porcentajeAsistenciaPromedio}% de las entradas vendidas`
                  : 'Sin entradas usadas'
              }
              icono={Users}
              color="bg-emerald-50 text-emerald-600"
              testId="kpi-asistentes"
            />

            <IndicadorKpi
              titulo="Entradas vendidas"
              valor={data.totales.totalEntradas.toLocaleString('es-AR')}
              detalle={`Recaudación: ${pesos(data.totales.totalRecaudado)}`}
              icono={Ticket}
              color="bg-blue-50 text-blue-600"
              testId="kpi-entradas"
            />

            <IndicadorKpi
              titulo="Ocupación promedio"
              valor={porcentaje(data.totales.porcentajeOcupacionPromedio)}
              detalle={`${data.totales.totalAsistentes} de ${data.totales.totalCapacidad} plazas totales`}
              icono={TrendingUp}
              color="bg-indigo-50 text-indigo-600"
              testId="kpi-ocupacion"
            />

            <IndicadorKpi
              titulo="Ausentismo (No-Show)"
              valor={data.totales.totalAusentes.toLocaleString('es-AR')}
              detalle={
                data.totales.totalEntradas > 0
                  ? `${(100 - (data.totales.porcentajeAsistenciaPromedio ?? 0)).toFixed(1)}% no se presentaron`
                  : 'Sin ausencias registradas'
              }
              icono={UserX}
              color="bg-rose-50 text-rose-600"
              testId="kpi-ausentes"
            />
          </div>

          {/* Tablero interactivo: Gráfico visual */}
          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Comparativa de capacidad, ventas y asistencia
                </h2>
                <p className="text-xs text-slate-500">
                  Visualización de entradas vendidas e ingresos validados por evento frente a su cupo máximo.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {data.eventos.length} {data.eventos.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            <GraficoAsistenciaEventos eventos={data.eventos} />
          </Card>

          {/* Tabla de detalle por evento */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Detalle por evento
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Datos desagregados de capacidad física, tickets emitidos y control de acceso.
              </p>
            </div>

            {data.eventos.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No se encontraron eventos con los filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500 uppercase">
                    <tr>
                      <th scope="col" className="px-5 py-3">Evento</th>
                      <th scope="col" className="px-3 py-3">Fecha</th>
                      <th scope="col" className="px-3 py-3">Lugar</th>
                      <th scope="col" className="px-3 py-3 text-right">Capacidad</th>
                      <th scope="col" className="px-3 py-3 text-right">Vendidas</th>
                      <th scope="col" className="px-3 py-3 text-right">Asistentes</th>
                      <th scope="col" className="px-3 py-3 text-right">Ausentes</th>
                      <th scope="col" className="px-3 py-3 text-center">% Asistencia</th>
                      <th scope="col" className="px-3 py-3 text-center">% Ocupación</th>
                      <th scope="col" className="px-3 py-3 text-right">Recaudado</th>
                      <th scope="col" className="px-5 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.eventos.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {ev.nombre}
                        </td>
                        <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-600">
                          {new Date(ev.fechaEvento).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-600">
                          {ev.lugarAcreditacion}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-600">
                          {ev.capacidadMaxima ?? '—'}
                        </td>
                        <td className="px-3 py-3.5 text-right font-medium tabular-nums text-blue-600">
                          {ev.totalEntradas}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-emerald-600">
                          {ev.ingresosValidados}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-500">
                          {ev.ausentes}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <BadgeAsistencia valor={ev.porcentajeAsistencia} />
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-600"
                                style={{ width: `${Math.min(ev.porcentajeOcupacion ?? 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-slate-700">
                              {porcentaje(ev.porcentajeOcupacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-900">
                          {pesos(ev.recaudado)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <BadgeEstado estado={ev.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Fila final de totales */}
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-5 py-3.5">
                        Totales consolidados ({data.totales.totalEventos} eventos)
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums">
                        {data.totales.totalCapacidad}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-blue-700">
                        {data.totales.totalEntradas}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-emerald-700">
                        {data.totales.totalAsistentes}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-rose-700">
                        {data.totales.totalAusentes}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <BadgeAsistencia valor={data.totales.porcentajeAsistenciaPromedio} />
                      </td>
                      <td className="px-3 py-3.5 text-center tabular-nums">
                        {porcentaje(data.totales.porcentajeOcupacionPromedio)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-slate-900">
                        {pesos(data.totales.totalRecaudado)}
                      </td>
                      <td className="px-5 py-3.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
