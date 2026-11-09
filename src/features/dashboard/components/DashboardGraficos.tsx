import {
  BarChart3,
  Coins,
  Dumbbell,
  PieChart as PieChartIcon,
  Ticket,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import type { DashboardMetricas } from '../types/dashboard.types';

interface DashboardGraficosProps {
  metricas: DashboardMetricas;
}

const COLORES_MOROSIDAD = {
  alDia: '#10b981', // emerald-500
  morosos: '#e11d48', // rose-600
} as const;

const COLORES_INSCRIPCIONES = {
  habilitadas: '#10b981', // emerald-500
  pendientes: '#f59e0b', // amber-500
  bloqueadas: '#e11d48', // rose-600
} as const;

const COLORES_COMPOSICION = {
  soloSocios: '#005fc2', // brand-600
  sociosDeportistas: '#7c3aed', // violet-600
  soloDeportistas: '#0891b2', // cyan-600
} as const;

const COLORES_CONCEPTO_CUOTA = {
  cuotaSocial: '#005fc2', // brand-600
  cuotaDeportiva: '#f97316', // accent-500
  ambasCuotas: '#e11d48', // rose-600
} as const;

const COLORES_EVENTOS = {
  vendidas: '#005fc2', // brand-600
  agotado: '#e11d48', // rose-600
  pista: '#f1f5f9', // slate-100
} as const;

/** Tipografía unificada de ejes SVG (12px en todos los gráficos). */
const ESTILO_TICK_CATEGORIA = {
  fontSize: 12,
  fontWeight: 600,
  fill: '#334155',
} as const;

const ESTILO_TICK_NUMERICO = {
  fontSize: 12,
  fontWeight: 500,
  fill: '#64748b',
} as const;

interface DatoSerieSimple {
  nombre: string;
  valor: number;
  porcentaje: number;
  color: string;
  gradienteId: string;
}

interface DatoInscripcion {
  estado: string;
  cantidad: number;
  porcentaje: number;
  etiquetaBarra: string;
  color: string;
  gradienteId: string;
}

interface DatoConceptoMorosidad {
  concepto: string;
  personas: number;
  porcentajeSobreActivos: number;
  etiquetaBarra: string;
  color: string;
  gradienteId: string;
}

interface DatoDisciplinaChart {
  nombre: string;
  nombreCorto: string;
  inscriptos: number;
  habilitados: number;
  irregulares: number;
  etiquetaTotal: string;
}

interface DatoEventoOcupacion {
  id: number;
  nombre: string;
  nombreCorto: string;
  vendidas: number;
  disponibles: number;
  capacidad: number;
  ocupacion: number;
  etiquetaOcupacion: string;
  agotado: boolean;
}

function truncarTexto(texto: string, max = 22): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

/** Tick SVG en una sola línea (12px, semibold) para ejes verticales de categorías. */
function TickCategoriaVertical(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const texto = String(props.payload?.value ?? '');
  return (
    <text
      x={x - 6}
      y={y}
      dy={4}
      textAnchor="end"
      fill={ESTILO_TICK_CATEGORIA.fill}
      fontSize={ESTILO_TICK_CATEGORIA.fontSize}
      fontWeight={ESTILO_TICK_CATEGORIA.fontWeight}
    >
      {texto}
    </text>
  );
}

/** Etiqueta superior de barra vertical en una sola línea (12px, bold). */
function EtiquetaSuperiorBarra(props: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: string | number;
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const texto = String(props.value ?? '');
  if (!texto) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill="#0f172a"
      fontSize={12}
      fontWeight={700}
    >
      {texto}
    </text>
  );
}

/** Etiqueta derecha de barra horizontal en una sola línea (12px, bold). */
function EtiquetaDerechaBarra(props: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: string | number;
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const texto = String(props.value ?? '');
  if (!texto) return null;
  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      fill="#0f172a"
      fontSize={12}
      fontWeight={700}
    >
      {texto}
    </text>
  );
}

function TooltipSerieSimple({
  active,
  payload,
  unidad = 'integrantes',
}: {
  active?: boolean;
  payload?: Array<{ payload: DatoSerieSimple }>;
  unidad?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xs">
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        <span>{item.nombre}</span>
      </div>
      <p className="mt-1 text-slate-600">
        Total:{' '}
        <span className="font-bold text-slate-900 tabular-nums">
          {item.valor} {unidad}
        </span>{' '}
        <span className="text-slate-500">({item.porcentaje.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

function TooltipInscripciones({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DatoInscripcion }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xs">
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        <span
          className="size-2.5 rounded-sm"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        <span>{item.estado}</span>
      </div>
      <p className="mt-1 text-slate-600">
        Total:{' '}
        <span className="font-bold text-slate-900 tabular-nums">
          {item.cantidad} {item.cantidad === 1 ? 'inscripción' : 'inscripciones'}
        </span>{' '}
        <span className="text-slate-500">({item.porcentaje.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

function TooltipConceptoMorosidad({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DatoConceptoMorosidad }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xs">
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        <span
          className="size-2.5 rounded-sm"
          style={{ backgroundColor: item.color }}
          aria-hidden="true"
        />
        <span>{item.concepto}</span>
      </div>
      <p className="mt-1 text-slate-600">
        Personas con deuda:{' '}
        <span className="font-bold text-slate-900 tabular-nums">{item.personas}</span>{' '}
        <span className="text-slate-500">({item.porcentajeSobreActivos.toFixed(0)}% del padrón)</span>
      </p>
    </div>
  );
}

function TooltipDisciplinas({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DatoDisciplinaChart }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xs">
      <p className="font-semibold text-slate-900">{item.nombre}</p>
      <p className="mt-1 text-slate-600">
        Total inscriptos:{' '}
        <span className="font-bold text-slate-900 tabular-nums">{item.inscriptos}</span>
      </p>
      <div className="mt-1.5 flex items-center gap-3 border-t border-slate-100 pt-1.5 text-xs">
        <span className="flex items-center gap-1 font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" />
          Habilitados: {item.habilitados}
        </span>
        <span className="flex items-center gap-1 font-semibold text-amber-700">
          <span className="size-2 rounded-full bg-amber-500" />
          Observados: {item.irregulares}
        </span>
      </div>
    </div>
  );
}

function TooltipOcupacionEvento({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DatoEventoOcupacion }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-xs">
      <p className="font-semibold text-slate-900">{item.nombre}</p>
      <p className="mt-1 text-slate-600">
        Vendidas:{' '}
        <span className="font-bold text-slate-900 tabular-nums">
          {item.vendidas} / {item.capacidad}
        </span>{' '}
        <span className="font-semibold text-brand-700">({item.ocupacion.toFixed(0)}%)</span>
      </p>
      <p className="mt-0.5 text-slate-500">
        Disponibles: <span className="font-medium text-slate-700">{item.disponibles}</span>
      </p>
    </div>
  );
}

/**
 * US-34 — Panel de visualizaciones gráficas (Recharts) alimentadas de GET /dashboard:
 * 1. Dona "Morosos vs. Al día"
 * 2. Barras "Inscripciones pendientes vs. bloqueadas"
 * 3. Dona "Composición de Integrantes Activos"
 * 4. Barras "Morosos por Tipo de Cuota"
 * 5. Barras Horizontales "Participantes Activos por Disciplina"
 * 6. Barras Horizontales "Ocupación de Próximos Eventos"
 */
export function DashboardGraficos({ metricas }: DashboardGraficosProps) {
  // ── 1. Morosos vs. Al día ─────────────────────────────────────────────────
  const totalActivos = Math.max(0, metricas.totalIntegrantesActivos);
  const cantidadMorosos = Math.min(totalActivos, Math.max(0, metricas.cantidadMorosos));
  const cantidadAlDia = Math.max(0, totalActivos - cantidadMorosos);

  const porcentajeMorosos =
    totalActivos > 0 ? Number(metricas.porcentajeMorosos.toFixed(1)) : 0;
  const porcentajeAlDia =
    totalActivos > 0 ? Number(Math.max(0, 100 - porcentajeMorosos).toFixed(1)) : 0;

  const datosMorosidad: DatoSerieSimple[] = [
    {
      nombre: 'Al día',
      valor: cantidadAlDia,
      porcentaje: porcentajeAlDia,
      color: COLORES_MOROSIDAD.alDia,
      gradienteId: 'grad-al-dia',
    },
    {
      nombre: 'Morosos',
      valor: cantidadMorosos,
      porcentaje: porcentajeMorosos,
      color: COLORES_MOROSIDAD.morosos,
      gradienteId: 'grad-morosos',
    },
  ];
  const segmentosDonaMorosidad = datosMorosidad.filter((d) => d.valor > 0);

  // ── 2. Inscripciones (Habilitadas, Pendientes y Bloqueadas) ───────────────
  const habilitadas = Math.max(0, metricas.inscripcionesIrregulares.habilitadas ?? 0);
  const pendientes = Math.max(0, metricas.inscripcionesIrregulares.pendientes);
  const bloqueadas = Math.max(0, metricas.inscripcionesIrregulares.bloqueadas);
  const totalIrregulares = pendientes + bloqueadas;
  const totalInscripciones = habilitadas + totalIrregulares;

  const porcHabilitadas =
    totalInscripciones > 0 ? Number(((habilitadas / totalInscripciones) * 100).toFixed(1)) : 0;
  const porcPendientes =
    totalInscripciones > 0 ? Number(((pendientes / totalInscripciones) * 100).toFixed(1)) : 0;
  const porcBloqueadas =
    totalInscripciones > 0 ? Number(((bloqueadas / totalInscripciones) * 100).toFixed(1)) : 0;

  const datosInscripciones: DatoInscripcion[] = [
    ...(habilitadas > 0 || metricas.inscripcionesIrregulares.habilitadas !== undefined
      ? [
          {
            estado: 'Habilitadas',
            cantidad: habilitadas,
            porcentaje: porcHabilitadas,
            etiquetaBarra: `${habilitadas} (${porcHabilitadas.toFixed(0)}%)`,
            color: COLORES_INSCRIPCIONES.habilitadas,
            gradienteId: 'grad-insc-habilitadas',
          },
        ]
      : []),
    {
      estado: 'Pendientes',
      cantidad: pendientes,
      porcentaje: porcPendientes,
      etiquetaBarra: `${pendientes} (${porcPendientes.toFixed(0)}%)`,
      color: COLORES_INSCRIPCIONES.pendientes,
      gradienteId: 'grad-insc-pendientes',
    },
    {
      estado: 'Bloqueadas',
      cantidad: bloqueadas,
      porcentaje: porcBloqueadas,
      etiquetaBarra: `${bloqueadas} (${porcBloqueadas.toFixed(0)}%)`,
      color: COLORES_INSCRIPCIONES.bloqueadas,
      gradienteId: 'grad-insc-bloqueadas',
    },
  ];
  const maximoEjeYInscripciones = Math.max(habilitadas, pendientes, bloqueadas, 4);

  // ── 3. Composición de Integrantes Activos ─────────────────────────────────
  const comp = metricas.composicionIntegrantes ?? {
    soloSocios: totalActivos,
    sociosDeportistas: 0,
    soloDeportistas: 0,
  };
  const totalComp = comp.soloSocios + comp.sociosDeportistas + comp.soloDeportistas;
  const baseComp = totalComp > 0 ? totalComp : totalActivos;

  const datosComposicion: DatoSerieSimple[] = [
    {
      nombre: 'Solo socios',
      valor: comp.soloSocios,
      porcentaje: baseComp > 0 ? Number(((comp.soloSocios / baseComp) * 100).toFixed(1)) : 0,
      color: COLORES_COMPOSICION.soloSocios,
      gradienteId: 'grad-comp-socios',
    },
    {
      nombre: 'Socios deportistas',
      valor: comp.sociosDeportistas,
      porcentaje:
        baseComp > 0 ? Number(((comp.sociosDeportistas / baseComp) * 100).toFixed(1)) : 0,
      color: COLORES_COMPOSICION.sociosDeportistas,
      gradienteId: 'grad-comp-ambos',
    },
    {
      nombre: 'Solo deportistas',
      valor: comp.soloDeportistas,
      porcentaje: baseComp > 0 ? Number(((comp.soloDeportistas / baseComp) * 100).toFixed(1)) : 0,
      color: COLORES_COMPOSICION.soloDeportistas,
      gradienteId: 'grad-comp-deportistas',
    },
  ];
  const segmentosComposicion = datosComposicion.filter((d) => d.valor > 0);

  // ── 4. Morosidad por Tipo de Cuota ────────────────────────────────────────
  const morosidadConcepto = metricas.morosidadPorConcepto ?? {
    cuotaSocial: cantidadMorosos,
    cuotaDeportiva: 0,
    ambasCuotas: 0,
  };
  const datosConceptoMorosidad: DatoConceptoMorosidad[] = [
    {
      concepto: 'Cuota social',
      personas: morosidadConcepto.cuotaSocial,
      porcentajeSobreActivos:
        totalActivos > 0 ? (morosidadConcepto.cuotaSocial / totalActivos) * 100 : 0,
      etiquetaBarra: `${morosidadConcepto.cuotaSocial} (${totalActivos > 0 ? ((morosidadConcepto.cuotaSocial / totalActivos) * 100).toFixed(0) : 0}%)`,
      color: COLORES_CONCEPTO_CUOTA.cuotaSocial,
      gradienteId: 'grad-cuota-social',
    },
    {
      concepto: 'Cuota deportiva',
      personas: morosidadConcepto.cuotaDeportiva,
      porcentajeSobreActivos:
        totalActivos > 0 ? (morosidadConcepto.cuotaDeportiva / totalActivos) * 100 : 0,
      etiquetaBarra: `${morosidadConcepto.cuotaDeportiva} (${totalActivos > 0 ? ((morosidadConcepto.cuotaDeportiva / totalActivos) * 100).toFixed(0) : 0}%)`,
      color: COLORES_CONCEPTO_CUOTA.cuotaDeportiva,
      gradienteId: 'grad-cuota-deportiva',
    },
    {
      concepto: 'Ambas cuotas',
      personas: morosidadConcepto.ambasCuotas,
      porcentajeSobreActivos:
        totalActivos > 0 ? (morosidadConcepto.ambasCuotas / totalActivos) * 100 : 0,
      etiquetaBarra: `${morosidadConcepto.ambasCuotas} (${totalActivos > 0 ? ((morosidadConcepto.ambasCuotas / totalActivos) * 100).toFixed(0) : 0}%)`,
      color: COLORES_CONCEPTO_CUOTA.ambasCuotas,
      gradienteId: 'grad-ambas-cuotas',
    },
  ];
  const totalConceptosMorosos =
    morosidadConcepto.cuotaSocial +
    morosidadConcepto.cuotaDeportiva +
    morosidadConcepto.ambasCuotas;
  const maxEjeYConcepto = Math.max(
    morosidadConcepto.cuotaSocial,
    morosidadConcepto.cuotaDeportiva,
    morosidadConcepto.ambasCuotas,
    4,
  );

  // ── 5. Participantes activos por Disciplina ───────────────────────────────
  const datosDisciplinas: DatoDisciplinaChart[] = (metricas.participantesPorDisciplina ?? [])
    .slice(0, 6)
    .map((d) => ({
      nombre: d.nombre,
      nombreCorto: truncarTexto(d.nombre, 20),
      inscriptos: d.inscriptos,
      habilitados: d.habilitados,
      irregulares: d.irregulares,
      etiquetaTotal: `${d.inscriptos}`,
    }));
  const maxInscriptosDisciplina = Math.max(...datosDisciplinas.map((d) => d.inscriptos), 4);

  // ── 6. Ocupación de Entradas en Próximos Eventos ──────────────────────────
  const datosEventosConCupo: DatoEventoOcupacion[] = metricas.proximosEventos
    .filter((e) => e.capacidadMaxima !== null && e.capacidadMaxima > 0)
    .map((e) => {
      const capacidad = e.capacidadMaxima ?? 0;
      const vendidas = Math.min(capacidad, Math.max(0, e.entradasVendidas));
      const disponibles = Math.max(0, e.entradasDisponibles ?? capacidad - vendidas);
      const ocupacion = capacidad > 0 ? Number(((vendidas / capacidad) * 100).toFixed(1)) : 0;
      return {
        id: e.id,
        nombre: e.nombre,
        nombreCorto: truncarTexto(e.nombre, 23),
        vendidas,
        disponibles,
        capacidad,
        ocupacion,
        etiquetaOcupacion: `${vendidas}/${capacidad} · ${ocupacion.toFixed(0)}%`,
        agotado: disponibles === 0,
      };
    });

  return (
    <section aria-label="Gráficos comparativos del dashboard" className="space-y-6">
      {/* Fila 1: Morosos vs. Al día + Inscripciones pendientes vs. bloqueadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Dona Morosos vs. Al día */}
        <Card className="flex flex-col justify-between p-6" data-testid="grafico-morosidad">
          <figure
            aria-labelledby="titulo-grafico-morosidad"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="bg-brand-50 text-brand-700 ring-brand-100 mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1">
                <PieChartIcon className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-morosidad"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Morosos vs. Al día
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Estado de pago sobre el padrón de integrantes activos
                </p>
              </div>
            </div>

            {totalActivos === 0 ? (
              <div
                data-testid="grafico-morosidad-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  Sin integrantes activos para graficar morosidad
                </p>
              </div>
            ) : (
              <div className="relative h-56 w-full" data-testid="grafico-morosidad-chart">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {porcentajeMorosos.toFixed(1)}%
                  </span>
                  <span className="mt-0.5 text-xs font-medium text-slate-500">morosidad</span>
                </div>

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <PieChart>
                    <defs>
                      <linearGradient id="grad-al-dia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="grad-morosos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[{ valor: 1 }]}
                      dataKey="valor"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      fill="#f1f5f9"
                      stroke="none"
                      isAnimationActive={false}
                    />
                    <Pie
                      data={segmentosDonaMorosidad}
                      dataKey="valor"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      paddingAngle={segmentosDonaMorosidad.length > 1 ? 4 : 0}
                      cornerRadius={segmentosDonaMorosidad.length > 1 ? 8 : 0}
                      stroke="none"
                      isAnimationActive={false}
                      labelLine={false}
                    >
                      {segmentosDonaMorosidad.map((item) => (
                        <Cell key={item.nombre} fill={`url(#${item.gradienteId})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipSerieSimple />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3.5 text-xs">
              {datosMorosidad.map((serie) => (
                <div
                  key={serie.nombre}
                  data-testid={`resumen-morosidad-${serie.nombre === 'Al día' ? 'al-dia' : 'morosos'}`}
                  className="flex items-center gap-2"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: serie.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-600">{serie.nombre}:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {serie.valor} ({serie.porcentaje.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </figcaption>
          </figure>
        </Card>

        {/* Gráfico 2: Barras Inscripciones pendientes vs. bloqueadas */}
        <Card className="flex flex-col justify-between p-6" data-testid="grafico-inscripciones">
          <figure
            aria-labelledby="titulo-grafico-inscripciones"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <BarChart3 className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-inscripciones"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Inscripciones pendientes vs. bloqueadas
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Inscripciones deportivas con observación documental
                </p>
              </div>
            </div>

            {totalInscripciones === 0 ? (
              <div
                data-testid="grafico-inscripciones-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  Sin inscripciones pendientes ni bloqueadas registradas
                </p>
              </div>
            ) : (
              <div className="h-56 w-full" data-testid="grafico-inscripciones-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <BarChart
                    data={datosInscripciones}
                    margin={{ top: 28, right: 20, left: -12, bottom: 4 }}
                    barCategoryGap="26%"
                  >
                    <defs>
                      <linearGradient id="grad-insc-habilitadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="grad-insc-pendientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient id="grad-insc-bloqueadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="estado"
                      axisLine={false}
                      tickLine={false}
                      tick={ESTILO_TICK_CATEGORIA}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, Math.ceil(maximoEjeYInscripciones * 1.25)]}
                      tick={ESTILO_TICK_NUMERICO}
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<TooltipInscripciones />} />
                    <Bar
                      dataKey="cantidad"
                      name="Inscripciones"
                      background={{ fill: '#f8fafc', radius: 8 }}
                      radius={[8, 8, 4, 4]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="etiquetaBarra" content={<EtiquetaSuperiorBarra />} />
                      {datosInscripciones.map((item) => (
                        <Cell key={item.estado} fill={`url(#${item.gradienteId})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3.5 text-xs">
              {datosInscripciones.map((item) => (
                <div
                  key={item.estado}
                  data-testid={`resumen-inscripciones-${item.estado.toLowerCase()}`}
                  className="flex items-center gap-2"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-600">{item.estado}:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{item.cantidad}</span>
                </div>
              ))}
            </figcaption>
          </figure>
        </Card>
      </div>

      {/* Fila 2: Composición de Integrantes Activos + Morosidad por Tipo de Cuota */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico 3: Dona Composición del Padrón Activo */}
        <Card className="flex flex-col justify-between p-6" data-testid="grafico-composicion">
          <figure
            aria-labelledby="titulo-grafico-composicion"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <Users className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-composicion"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Composición de Integrantes Activos
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Perfil de vinculación social y deportiva en el club
                </p>
              </div>
            </div>

            {totalActivos === 0 || segmentosComposicion.length === 0 ? (
              <div
                data-testid="grafico-composicion-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  Sin integrantes activos registrados para desglosar
                </p>
              </div>
            ) : (
              <div className="relative h-56 w-full" data-testid="grafico-composicion-chart">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {totalActivos}
                  </span>
                  <span className="mt-0.5 text-xs font-medium text-slate-500">activos</span>
                </div>

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <PieChart>
                    <defs>
                      <linearGradient id="grad-comp-socios" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#005fc2" />
                      </linearGradient>
                      <linearGradient id="grad-comp-ambos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#6d28d9" />
                      </linearGradient>
                      <linearGradient id="grad-comp-deportistas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[{ valor: 1 }]}
                      dataKey="valor"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      fill="#f1f5f9"
                      stroke="none"
                      isAnimationActive={false}
                    />
                    <Pie
                      data={segmentosComposicion}
                      dataKey="valor"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      paddingAngle={segmentosComposicion.length > 1 ? 4 : 0}
                      cornerRadius={segmentosComposicion.length > 1 ? 8 : 0}
                      stroke="none"
                      isAnimationActive={false}
                      labelLine={false}
                    >
                      {segmentosComposicion.map((item) => (
                        <Cell key={item.nombre} fill={`url(#${item.gradienteId})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipSerieSimple />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-3.5 text-xs">
              {datosComposicion.map((item) => (
                <div key={item.nombre} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-600">{item.nombre}:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {item.valor} ({item.porcentaje.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </figcaption>
          </figure>
        </Card>

        {/* Gráfico 4: Barras Morosidad por Concepto de Cuota */}
        <Card
          className="flex flex-col justify-between p-6"
          data-testid="grafico-morosidad-concepto"
        >
          <figure
            aria-labelledby="titulo-grafico-morosidad-concepto"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100">
                <Coins className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-morosidad-concepto"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Morosos por Tipo de Cuota
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Integrantes activos con deuda vencida según concepto
                </p>
              </div>
            </div>

            {totalConceptosMorosos === 0 ? (
              <div
                data-testid="grafico-morosidad-concepto-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  No se registran deudas vencidas de cuota social ni deportiva
                </p>
              </div>
            ) : (
              <div className="h-56 w-full" data-testid="grafico-morosidad-concepto-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <BarChart
                    data={datosConceptoMorosidad}
                    margin={{ top: 28, right: 20, left: -12, bottom: 4 }}
                    barCategoryGap="26%"
                  >
                    <defs>
                      <linearGradient id="grad-cuota-social" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#005fc2" />
                      </linearGradient>
                      <linearGradient id="grad-cuota-deportiva" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <linearGradient id="grad-ambas-cuotas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="concepto"
                      axisLine={false}
                      tickLine={false}
                      tick={ESTILO_TICK_CATEGORIA}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, Math.ceil(maxEjeYConcepto * 1.25)]}
                      tick={ESTILO_TICK_NUMERICO}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={<TooltipConceptoMorosidad />}
                    />
                    <Bar
                      dataKey="personas"
                      name="Personas"
                      background={{ fill: '#f8fafc', radius: 8 }}
                      radius={[8, 8, 4, 4]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="etiquetaBarra" content={<EtiquetaSuperiorBarra />} />
                      {datosConceptoMorosidad.map((item) => (
                        <Cell key={item.concepto} fill={`url(#${item.gradienteId})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-3.5 text-xs">
              {datosConceptoMorosidad.map((item) => (
                <div key={item.concepto} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-600">{item.concepto}</span>
                </div>
              ))}
            </figcaption>
          </figure>
        </Card>
      </div>

      {/* Fila 3: Participantes por Disciplina + Ocupación de Próximos Eventos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico 5: Barras Horizontales Participantes por Disciplina */}
        <Card className="flex flex-col justify-between p-6" data-testid="grafico-disciplinas">
          <figure
            aria-labelledby="titulo-grafico-disciplinas"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Dumbbell className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-disciplinas"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Participantes Activos por Disciplina
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Inscripciones habilitadas y observadas por disciplina deportiva
                </p>
              </div>
            </div>

            {datosDisciplinas.length === 0 ? (
              <div
                data-testid="grafico-disciplinas-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  Sin inscripciones activas en disciplinas deportivas
                </p>
              </div>
            ) : (
              <div className="h-56 w-full" data-testid="grafico-disciplinas-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <BarChart
                    data={datosDisciplinas}
                    layout="vertical"
                    margin={{ top: 4, right: 36, left: 8, bottom: 4 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, Math.ceil(maxInscriptosDisciplina * 1.15)]}
                      tick={ESTILO_TICK_NUMERICO}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombreCorto"
                      width={136}
                      axisLine={false}
                      tickLine={false}
                      tick={<TickCategoriaVertical />}
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<TooltipDisciplinas />} />
                    <Bar
                      dataKey="habilitados"
                      name="Habilitados"
                      stackId="disc"
                      fill="#10b981"
                      radius={[4, 0, 0, 4]}
                      maxBarSize={22}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="irregulares"
                      name="Observados"
                      stackId="disc"
                      fill="#f59e0b"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={22}
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="etiquetaTotal" content={<EtiquetaDerechaBarra />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
                Habilitados
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-sm bg-amber-500" aria-hidden="true" />
                Con observación
              </span>
            </figcaption>
          </figure>
        </Card>

        {/* Gráfico 6: Ocupación de Entradas en Próximos Eventos */}
        <Card
          className="flex flex-col justify-between p-6"
          data-testid="grafico-ocupacion-eventos"
        >
          <figure
            aria-labelledby="titulo-grafico-ocupacion-eventos"
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <Ticket className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="titulo-grafico-ocupacion-eventos"
                  className="text-xs font-semibold tracking-wider text-slate-800 uppercase"
                >
                  Ocupación de Próximos Eventos
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Entradas vendidas sobre la capacidad máxima por evento publicado
                </p>
              </div>
            </div>

            {datosEventosConCupo.length === 0 ? (
              <div
                data-testid="grafico-ocupacion-eventos-vacio"
                className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center"
              >
                <p className="text-sm font-medium text-slate-600">
                  No hay próximos eventos con límite de capacidad para graficar ocupación
                </p>
              </div>
            ) : (
              <div className="h-56 w-full" data-testid="grafico-ocupacion-eventos-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 420, height: 224 }}
                >
                  <BarChart
                    data={datosEventosConCupo}
                    layout="vertical"
                    margin={{ top: 4, right: 102, left: 8, bottom: 4 }}
                    barCategoryGap="24%"
                  >
                    <defs>
                      <linearGradient id="grad-evento-ocupacion" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#005fc2" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="grad-evento-agotado" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      unit="%"
                      axisLine={false}
                      tickLine={false}
                      tick={ESTILO_TICK_NUMERICO}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombreCorto"
                      width={148}
                      axisLine={false}
                      tickLine={false}
                      tick={<TickCategoriaVertical />}
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<TooltipOcupacionEvento />} />
                    <Bar
                      dataKey="ocupacion"
                      name="Ocupación"
                      background={{ fill: COLORES_EVENTOS.pista, radius: 6 }}
                      radius={[6, 6, 6, 6]}
                      maxBarSize={22}
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="etiquetaOcupacion" content={<EtiquetaDerechaBarra />} />
                      {datosEventosConCupo.map((item) => (
                        <Cell
                          key={item.id}
                          fill={
                            item.agotado
                              ? 'url(#grad-evento-agotado)'
                              : 'url(#grad-evento-ocupacion)'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <figcaption className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: COLORES_EVENTOS.vendidas }}
                  aria-hidden="true"
                />
                En venta
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: COLORES_EVENTOS.agotado }}
                  aria-hidden="true"
                />
                Agotado (100%)
              </span>
            </figcaption>
          </figure>
        </Card>
      </div>
    </section>
  );
}
