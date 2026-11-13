import { useState } from 'react';
import type { EventoReporteItem } from '../types';

interface GraficoAsistenciaEventosProps {
  eventos: EventoReporteItem[];
}

type LimiteVisualizacion = 5 | 10 | 'todos';

/**
 * US-36 — Gráfico comparativo de barras horizontales de asistencia y ocupación por evento.
 * Muestra por cada evento:
 * - Capacidad máxima (barra gris de fondo/guía)
 * - Entradas vendidas (barra azul institucional)
 * - Asistentes reales validados (barra verde esmeralda)
 */
export function GraficoAsistenciaEventos({ eventos }: GraficoAsistenciaEventosProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [limite, setLimite] = useState<LimiteVisualizacion>(10);

  // Filtrar eventos con al menos capacidad o entradas para la gráfica
  const eventosGraficablesTotal = eventos.filter(
    (e) => (e.capacidadMaxima && e.capacidadMaxima > 0) || e.totalEntradas > 0,
  );

  if (eventosGraficablesTotal.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No hay datos suficientes para graficar en el período seleccionado.
      </div>
    );
  }

  // Aplicar límite de visualización
  const eventosGraficables =
    limite === 'todos' ? eventosGraficablesTotal : eventosGraficablesTotal.slice(0, limite);

  // Dimensiones del canvas SVG horizontal
  const width = 850;
  const paddingLeft = 250; // Espacio generoso para nombres completos de eventos
  const paddingRight = 45;
  const paddingTop = 20;
  const paddingBottom = 40;

  const rowHeight = 44; // Altura por cada evento
  const barThickness = 8; // Grosor de cada barra individual
  const barGap = 2; // Espacio entre las barras de un mismo evento

  const chartHeight = eventosGraficables.length * rowHeight;
  const height = paddingTop + chartHeight + paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  // Valor máximo en el eje X
  const maxVal = Math.max(
    ...eventosGraficables.map((e) =>
      Math.max(e.capacidadMaxima ?? 0, e.totalEntradas, e.ingresosValidados),
    ),
    10,
  );
  // Techo redondeado al múltiplo superior
  const xMax = Math.ceil((maxVal * 1.15) / 20) * 20;

  const numGridLines = 5;
  const gridSteps = Array.from({ length: numGridLines + 1 }, (_, i) =>
    Math.round((xMax / numGridLines) * i),
  );

  return (
    <div className="space-y-4">
      {/* Controles superiores: Leyenda y Selector de límite */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-slate-300" />
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

        {/* Selector de cantidad visible */}
        {eventosGraficablesTotal.length > 5 && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <span className="text-slate-500 px-1 text-[11px] font-medium">Mostrar:</span>
            {( [5, 10, 'todos'] as const ).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setLimite(opcion)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  limite === opcion
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {opcion === 'todos' ? `Todos (${eventosGraficablesTotal.length})` : opcion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SVG del Gráfico Horizontal */}
      <div className="relative w-full overflow-x-auto rounded-lg border border-slate-100 bg-white p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none font-sans"
          role="img"
          aria-label="Gráfico de barras de asistencia a eventos"
        >
          {/* Líneas verticales de guía (Eje X) */}
          {gridSteps.map((step) => {
            const x = paddingLeft + (step / xMax) * chartWidth;
            return (
              <g key={step}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  className="tabular-nums"
                >
                  {step}
                </text>
              </g>
            );
          })}

          {/* Línea base vertical izquierda */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Filas por cada evento */}
          {eventosGraficables.map((ev, index) => {
            const rowY = paddingTop + index * rowHeight;
            const isHovered = hoverIndex === index;

            const wCap = ((ev.capacidadMaxima ?? 0) / xMax) * chartWidth;
            const wVend = (ev.totalEntradas / xMax) * chartWidth;
            const wAsist = (ev.ingresosValidados / xMax) * chartWidth;

            const yCap = rowY + 8;
            const yVend = yCap + barThickness + barGap;
            const yAsist = yVend + barThickness + barGap;

            // Nombre completo del evento y fecha
            const nombreCompleto = ev.nombre;
            const fechaFormateada = new Date(ev.fechaEvento).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
            });

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
                    x={4}
                    y={rowY + 2}
                    width={width - 8}
                    height={rowHeight - 4}
                    fill="#f8fafc"
                    rx="6"
                  />
                )}

                {/* Etiqueta Eje Y: Nombre completo del evento */}
                <text
                  x={paddingLeft - 12}
                  y={rowY + 18}
                  textAnchor="end"
                  fontSize="10.5"
                  fontWeight={isHovered ? '600' : '500'}
                  fill={isHovered ? '#0f172a' : '#334155'}
                >
                  {nombreCompleto}
                </text>

                {/* Subetiqueta Eje Y: Fecha del evento */}
                <text
                  x={paddingLeft - 12}
                  y={rowY + 30}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  className="tabular-nums"
                >
                  {fechaFormateada}
                </text>

                {/* Barra 1: Capacidad Máxima */}
                {ev.capacidadMaxima && (
                  <rect
                    x={paddingLeft}
                    y={yCap}
                    width={Math.max(2, wCap)}
                    height={barThickness}
                    fill="#cbd5e1"
                    rx={barThickness / 2}
                  />
                )}

                {/* Barra 2: Entradas Vendidas */}
                <rect
                  x={paddingLeft}
                  y={yVend}
                  width={Math.max(2, wVend)}
                  height={barThickness}
                  fill="#2563eb"
                  rx={barThickness / 2}
                />

                {/* Barra 3: Asistentes Validados */}
                <rect
                  x={paddingLeft}
                  y={yAsist}
                  width={Math.max(2, wAsist)}
                  height={barThickness}
                  fill="#059669"
                  rx={barThickness / 2}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip flotante interactivo */}
        {hoverIndex !== null && eventosGraficables[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
            style={{
              left: `${paddingLeft + 15}px`,
              top: `${Math.min(
                paddingTop + hoverIndex * rowHeight,
                Math.max(10, height - 190),
              )}px`,
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
