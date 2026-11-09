import { AlertTriangle, FileClock, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import type { DashboardMetricas } from '../types/dashboard.types';
import { formatearPorcentajeMorosos, obtenerSemaforoMorosidad } from '../utils/dashboard.utils';

interface DashboardKpiCardsProps {
  metricas: DashboardMetricas;
}

export function DashboardKpiCards({ metricas }: DashboardKpiCardsProps) {
  const navigate = useNavigate();
  const semaforo = obtenerSemaforoMorosidad(metricas.porcentajeMorosos);

  return (
    <section aria-label="Indicadores clave de gestión">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta 1: Total de Integrantes Activos */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.socios)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(ROUTES.socios);
            }
          }}
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xs font-semibold whitespace-nowrap text-slate-600">
              Total de Integrantes Activos
            </h2>
            <div className="bg-brand-50 text-brand-700 ring-brand-100 group-hover:bg-brand-600 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors group-hover:text-white">
              <Users className="size-4" aria-hidden="true" />
            </div>
          </div>

          <p
            data-testid="kpi-integrantes-activos"
            className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
          >
            {metricas.totalIntegrantesActivos}
          </p>
        </Card>

        {/* Tarjeta 2: Porcentaje de Morosos */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.morososCuotaSocial)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(ROUTES.morososCuotaSocial);
            }
          }}
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xs font-semibold whitespace-nowrap text-slate-600">
              Porcentaje de Morosos
            </h2>
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p
              data-testid="kpi-porcentaje-morosos"
              className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {formatearPorcentajeMorosos(metricas.porcentajeMorosos)}
            </p>
            <Badge
              variant={semaforo.varianteBadge}
              data-testid="semaforo-morosidad"
              data-nivel={semaforo.nivel}
              className="shrink-0 text-xs"
            >
              <span className={`size-1.5 rounded-full ${semaforo.clasePunto}`} />
              {semaforo.etiqueta}
            </Badge>
          </div>
        </Card>

        {/* Tarjeta 3: Documentos por Vencer */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.participantes)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(ROUTES.participantes);
            }
          }}
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xs font-semibold whitespace-nowrap text-slate-600">
              Documentos por Vencer
            </h2>
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-600 group-hover:text-white">
              <FileClock className="size-4" aria-hidden="true" />
            </div>
          </div>

          <p
            data-testid="kpi-documentos-por-vencer"
            className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
          >
            {metricas.documentosPorVencer}
          </p>
        </Card>

        {/* Tarjeta 4: Inscripciones Irregulares */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.participantes)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(ROUTES.participantes);
            }
          }}
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xs font-semibold whitespace-nowrap text-slate-600">
              Inscripciones Irregulares
            </h2>
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 transition-colors group-hover:bg-rose-600 group-hover:text-white">
              <ShieldAlert className="size-4" aria-hidden="true" />
            </div>
          </div>

          <p
            data-testid="kpi-inscripciones-irregulares"
            className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
          >
            {metricas.inscripcionesIrregulares.total}
          </p>
        </Card>
      </div>
    </section>
  );
}
