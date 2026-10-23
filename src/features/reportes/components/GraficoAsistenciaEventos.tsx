import { useState } from 'react';
import type { EventoReporteItem } from '../types';

interface GraficoAsistenciaEventosProps {
  eventos: EventoReporteItem[];
}

/**
 * US-36 — Gráfico comparativo de barras de asistencia y ocupación por evento.
 * Muestra por cada evento:
 * - Capacidad máxima (guía tenue)
 * - Entradas vendidas (azul institucional)
 * - Asistentes reales validados (verde esmeralda)
 */
export function GraficoAsistenciaEventos({ eventos }: GraficoAsistenciaEventosProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filtrar eventos con al menos capacidad o entradas para la gráfica
  const eventosGraficables = eventos.filter(
    (e) => (e.capacidadMaxima && e.capacidadMaxima > 0) || e.totalEntradas > 0,
  );

  if (eventosGraficables.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No hay datos suficientes para graficar en el período seleccionado.
      </div>
    );
  }

  // Dimensiones del canvas SVG
  const width = 800;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 55;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Valor máximo en el eje Y
  const maxVal = Math.max(
    ...eventosGraficables.map((e) => Math.max(e.capacidadMaxima ?? 0, e.totalEntradas, e.ingresosValidados)),
    10,
  );
  // Redondear techo al múltiplo de 20 superior
  const yMax = Math.ceil((maxVal * 1.15) / 20) * 20;

  const numGridLines = 4;
  const gridSteps = Array.from({ length: numGridLines + 1 }, (_, i) => Math.round((yMax / numGridLines) * i));

  // Ancho y separación de grupos
  const groupWidth = chartWidth / eventosGraficables.length;
  const barWidth = Math.min(22, groupWidth * 0.28);
  const barGap = 4;

  return (
    <div className="space-y-4">
      {/* Leyenda interactiva */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-slate-200" />
            <span>Capacidad total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-[#2563eb]" />
            <span className="font-medium text-slate-700">Entradas vendidas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-[#059669]" />
            <span className="font-medium text-slate-700">Asistentes validados</span>
          </div>
        </div>
        <span className="text-slate-400">Pasa el cursor sobre una columna para ver detalles</span>
      </div>

      {/* SVG del Gráfico */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none font-sans"
          role="img"
          aria-label="Gráfico de barras de asistencia a eventos"
        >
          {/* Líneas horizontales de guía */}
          {gridSteps.map((step) => {
            const y = paddingTop + chartHeight - (step / yMax) * chartHeight;
            return (
              <g key={step}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  className="tabular-nums"
                >
                  {step}
                </text>
              </g>
            );
          })}

          {/* Columnas por cada evento */}
          {eventosGraficables.map((ev, index) => {
            const groupX = paddingLeft + index * groupWidth + (groupWidth - (barWidth * 3 + barGap * 2)) / 2;

            const hCap = ((ev.capacidadMaxima ?? 0) / yMax) * chartHeight;
            const hVend = (ev.totalEntradas / yMax) * chartHeight;
            const hAsist = (ev.ingresosValidados / yMax) * chartHeight;

            const yCap = paddingTop + chartHeight - hCap;
            const yVend = paddingTop + chartHeight - hVend;
            const yAsist = paddingTop + chartHeight - hAsist;

            const xCap = groupX;
            const xVend = groupX + barWidth + barGap;
            const xAsist = groupX + (barWidth + barGap) * 2;

            const isHovered = hoverIndex === index;

            // Formato de nombre abreviado
            const nombreCorto = ev.nombre.length > 14 ? `${ev.nombre.slice(0, 13)}…` : ev.nombre;

            return (
              <g
                key={ev.id}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer transition-opacity"
                opacity={hoverIndex === null || isHovered ? 1 : 0.45}
              >
                {/* Zona de foco hover de fondo */}
                {isHovered && (
                  <rect
                    x={paddingLeft + index * groupWidth + 2}
                    y={paddingTop - 5}
                    width={groupWidth - 4}
                    height={chartHeight + 10}
                    fill="#f1f5f9"
                    rx="4"
                    opacity="0.6"
                  />
                )}

                {/* Barra Capacidad */}
                {ev.capacidadMaxima && (
                  <rect
                    x={xCap}
                    y={yCap}
                    width={barWidth}
                    height={Math.max(2, hCap)}
                    fill="#cbd5e1"
                    rx="2"
                  />
                )}

                {/* Barra Vendidas */}
                <rect
                  x={xVend}
                  y={yVend}
                  width={barWidth}
                  height={Math.max(2, hVend)}
                  fill="#2563eb"
                  rx="2"
                />

                {/* Barra Asistentes Validados */}
                <rect
                  x={xAsist}
                  y={yAsist}
                  width={barWidth}
                  height={Math.max(2, hAsist)}
                  fill="#059669"
                  rx="2"
                />

                {/* Etiqueta Eje X (Nombre de Evento) */}
                <text
                  x={paddingLeft + index * groupWidth + groupWidth / 2}
                  y={paddingTop + chartHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '400'}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {nombreCorto}
                </text>

                {/* Subetiqueta (Fecha día/mes) */}
                <text
                  x={paddingLeft + index * groupWidth + groupWidth / 2}
                  y={paddingTop + chartHeight + 28}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#94a3b8"
                >
                  {new Date(ev.fechaEvento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip flotante interactivo */}
        {hoverIndex !== null && eventosGraficables[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
            style={{
              left: `${Math.min(
                Math.max(paddingLeft + hoverIndex * groupWidth, 10),
                width - 240,
              )}px`,
              top: '8px',
            }}
          >
            <div className="font-semibold text-slate-900">
              {eventosGraficables[hoverIndex].nombre}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(eventosGraficables[hoverIndex].fechaEvento).toLocaleDateString('es-AR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              · {eventosGraficables[hoverIndex].lugarAcreditacion}
            </div>

            <div className="mt-2.5 space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Capacidad máxima:</span>
                <span className="font-medium text-slate-700">
                  {eventosGraficables[hoverIndex].capacidadMaxima ?? 'Sin cupo'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Entradas vendidas:</span>
                <span className="font-bold text-[#2563eb]">
                  {eventosGraficables[hoverIndex].totalEntradas}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Asistentes validados:</span>
                <span className="font-bold text-[#059669]">
                  {eventosGraficables[hoverIndex].ingresosValidados}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Ausentismo (No-show):</span>
                <span className="font-medium text-rose-600">
                  {eventosGraficables[hoverIndex].ausentes}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600 font-medium">% Asistencia:</span>
                  <span className="font-bold text-slate-900">
                    {eventosGraficables[hoverIndex].porcentajeAsistencia !== null
                      ? `${eventosGraficables[hoverIndex].porcentajeAsistencia}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600 font-medium">% Ocupación:</span>
                  <span className="font-bold text-slate-900">
                    {eventosGraficables[hoverIndex].porcentajeOcupacion !== null
                      ? `${eventosGraficables[hoverIndex].porcentajeOcupacion}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
