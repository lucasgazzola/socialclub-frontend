import { AlertTriangle, ArrowRight, FileClock, ShieldAlert, Users } from 'lucide-react';
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
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="bg-brand-50 text-brand-700 ring-brand-100 group-hover:bg-brand-600 inline-flex rounded-xl p-2.5 ring-1 transition-colors group-hover:text-white">
                <Users className="size-5" />
              </div>
              <Badge variant="default">Padrón</Badge>
            </div>
            <h2 className="mt-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Total de Integrantes Activos
            </h2>
            <p
              data-testid="kpi-integrantes-activos"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900"
            >
              {metricas.totalIntegrantesActivos}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Socios y participantes activos de la organización
            </p>
          </div>
          <div className="text-brand-700 mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100">
            <span>Ver socios</span>
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
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
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="inline-flex rounded-xl bg-amber-50 p-2.5 text-amber-700 ring-1 ring-amber-100 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                <AlertTriangle className="size-5" />
              </div>
              <Badge
                variant={semaforo.varianteBadge}
                data-testid="semaforo-morosidad"
                data-nivel={semaforo.nivel}
              >
                <span className={`size-2 rounded-full ${semaforo.clasePunto}`} />
                {semaforo.etiqueta}
              </Badge>
            </div>
            <h2 className="mt-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Porcentaje de Morosos
            </h2>
            <p
              data-testid="kpi-porcentaje-morosos"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900"
            >
              {formatearPorcentajeMorosos(metricas.porcentajeMorosos)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {metricas.cantidadMorosos}{' '}
              {metricas.cantidadMorosos === 1 ? 'persona morosa' : 'personas morosas'} sobre{' '}
              {metricas.totalIntegrantesActivos} activos
            </p>
          </div>
          <div className="text-brand-700 mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100">
            <span>Ver morosos</span>
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Card>

        {/* Tarjeta 3: Documentos por Vencer (Próximos 10 días) */}
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
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                <FileClock className="size-5" />
              </div>
              <Badge variant={metricas.documentosPorVencer > 0 ? 'warning' : 'success'}>
                Próximos 10 días
              </Badge>
            </div>
            <h2 className="mt-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Documentos por Vencer
            </h2>
            <p
              data-testid="kpi-documentos-por-vencer"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900"
            >
              {metricas.documentosPorVencer}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Certificados con vencimiento en los próximos 10 días
            </p>
          </div>
          <div className="text-brand-700 mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100">
            <span>Ver participantes</span>
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
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
          className="group hover:border-brand-300 flex cursor-pointer flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="inline-flex rounded-xl bg-rose-50 p-2.5 text-rose-700 ring-1 ring-rose-100 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                <ShieldAlert className="size-5" />
              </div>
              <Badge variant={metricas.inscripcionesIrregulares.total > 0 ? 'danger' : 'success'}>
                Control documental
              </Badge>
            </div>
            <h2 className="mt-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Inscripciones Irregulares
            </h2>
            <p
              data-testid="kpi-inscripciones-irregulares"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900"
            >
              {metricas.inscripcionesIrregulares.total}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="warning" className="text-[11px]">
                Pendientes: {metricas.inscripcionesIrregulares.pendientes}
              </Badge>
              <Badge variant="danger" className="text-[11px]">
                Bloqueadas: {metricas.inscripcionesIrregulares.bloqueadas}
              </Badge>
            </div>
          </div>
          <div className="text-brand-700 mt-4 flex items-center gap-1 text-xs font-semibold opacity-80 group-hover:opacity-100">
            <span>Gestionar inscripciones</span>
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </Card>
      </div>
    </section>
  );
}
