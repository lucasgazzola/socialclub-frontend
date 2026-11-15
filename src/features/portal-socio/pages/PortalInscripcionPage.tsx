import { useState } from 'react';
import { CalendarClock, Dumbbell, FileText, Users } from 'lucide-react';
import {
  useCatalogoInscripcion,
  useMisSolicitudesInscripcion,
} from '@/features/inscripcion/hooks/useSolicitarInscripcion';
import type {
  DisciplinaCatalogo,
  EstadoSolicitudInscripcion,
} from '@/features/inscripcion/types';
import { PortalSolicitarInscripcionModal } from '../components/PortalModals';
import {
  PortalButton,
  PortalEmptyState,
  PortalSegmentedSwitch,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

type TabView = 'catalogo' | 'solicitudes';

const ESTADO_SOLICITUD_TONE: Record<
  EstadoSolicitudInscripcion,
  { label: string; tone: 'active' | 'pending' | 'danger' | 'neutral' }
> = {
  PENDIENTE: { label: 'Pendiente', tone: 'pending' },
  APROBADA: { label: 'Aprobada', tone: 'active' },
  RECHAZADA: { label: 'Rechazada', tone: 'danger' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral' },
};

/**
 * Disciplinas e inscripción propias del portal de socios: tarjetas afiladas + lista de postulaciones sin tabla admin.
 */
export function PortalInscripcionPage() {
  const [tabActual, setTabActual] = useState<TabView>('catalogo');
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] =
    useState<DisciplinaCatalogo | null>(null);

  const {
    data: catalogo,
    isLoading: cargandoCatalogo,
    error: errorCatalogo,
  } = useCatalogoInscripcion();
  const { data: solicitudes = [], isLoading: cargandoSolicitudes } =
    useMisSolicitudesInscripcion();

  const disciplinas = catalogo?.items ?? [];

  return (
    <div className="space-y-6" data-testid="pagina-solicitar-inscripcion">
      <PortalTitleBar
        title="Disciplinas e inscripción"
        summary="Explorá actividades vigentes, revisá beneficios para socios y gestioná tus postulaciones."
      />

      <div data-testid="tabs-solicitud-inscripcion">
        <PortalSegmentedSwitch<TabView>
          ariaLabel="Vistas de inscripción"
          value={tabActual}
          onChange={setTabActual}
          tabs={[
            { value: 'catalogo', label: 'Catálogo de disciplinas', count: disciplinas.length },
            { value: 'solicitudes', label: 'Mis solicitudes', count: solicitudes.length },
          ]}
        />
      </div>

      {tabActual === 'catalogo' ? (
        cargandoCatalogo ? (
          <div className="flex h-48 items-center justify-center" data-testid="spinner-catalogo">
            <PortalSpinner />
          </div>
        ) : errorCatalogo ? (
          <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
            {errorCatalogo.message || 'No se pudo cargar el catálogo de disciplinas.'}
          </PortalSurface>
        ) : disciplinas.length === 0 ? (
          <PortalEmptyState
            testId="sin-disciplinas-activas"
            icon={<Dumbbell size={20} />}
            title="No hay disciplinas activas disponibles"
            description="Pronto se habilitarán nuevas actividades deportivas para postularte."
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="catalogo-disciplinas-grid"
          >
            {disciplinas.map((d) => {
              const puedeSolicitar = !d.inscripto && !d.solicitudPendiente;

              return (
                <PortalSurface
                  key={d.id}
                  className="flex flex-col justify-between p-5 hover:border-blue-400/35 hover:bg-[#0e1627]"
                >
                  <div className="flex flex-1 flex-col" data-testid={`tarjeta-disciplina-${d.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                        {d.nombre}
                      </h2>
                      {d.inscripto ? (
                        <PortalTag tone="active" dot>
                          Inscripto
                        </PortalTag>
                      ) : d.solicitudPendiente ? (
                        <PortalTag tone="pending" dot>
                          Pendiente
                        </PortalTag>
                      ) : null}
                    </div>

                    {d.descripcion && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {d.descripcion}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      <div className="border-y border-slate-300/[0.08] py-3">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Arancel mensual
                        </span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-xl font-semibold text-white tabular-nums">
                            ${d.arancelMensual.toLocaleString('es-AR')}
                          </span>
                          <span className="text-xs text-slate-400">/ mes</span>
                        </div>
                        {d.descuentoSocioPorcentaje > 0 && catalogo?.esSocio && (
                          <p className="mt-1 text-[11px] font-medium text-blue-400">
                            Incluye {d.descuentoSocioPorcentaje}% descuento socio
                          </p>
                        )}
                      </div>

                      <div className="mt-3.5 space-y-2 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="shrink-0 text-blue-400" />
                          <span>
                            {d.categorias.length > 0
                              ? `${d.categorias.length} ${d.categorias.length === 1 ? 'categoría activa' : 'categorías activas'}`
                              : 'Sin categorías divididas'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="shrink-0 text-blue-400" />
                          <span>
                            {d.documentosObligatorios.length > 0
                              ? `${d.documentosObligatorios.length} ${d.documentosObligatorios.length === 1 ? 'requisito documental' : 'requisitos documentales'}`
                              : 'Sin documentación obligatoria'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-300/[0.08] pt-4">
                    <PortalButton
                      variant={puedeSolicitar ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full"
                      disabled={!puedeSolicitar}
                      onClick={() => setDisciplinaSeleccionada(d)}
                      data-testid={`btn-postularse-${d.id}`}
                    >
                      {d.inscripto
                        ? 'Ya estás inscripto'
                        : d.solicitudPendiente
                          ? 'Solicitud en revisión'
                          : 'Postularme'}
                    </PortalButton>
                  </div>
                </PortalSurface>
              );
            })}
          </div>
        )
      ) : cargandoSolicitudes ? (
        <div className="flex h-48 items-center justify-center" data-testid="spinner-solicitudes">
          <PortalSpinner />
        </div>
      ) : solicitudes.length === 0 ? (
        <PortalEmptyState
          testId="sin-solicitudes"
          icon={<CalendarClock size={20} />}
          title="Todavía no enviaste solicitudes"
          description="Explorá las disciplinas activas del club para postularte desde tu cuenta."
          action={
            <PortalButton variant="primary" size="sm" onClick={() => setTabActual('catalogo')}>
              Ver catálogo
            </PortalButton>
          }
        />
      ) : (
        /* Feed cronológico de postulaciones (sin <table> administrativa) */
        <PortalSurface
          className="divide-y divide-slate-300/[0.08] overflow-hidden"
          data-testid="tabla-mis-solicitudes"
        >
          {solicitudes.map((s) => {
            const fecha = new Date(s.fechaSolicitud).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const meta = ESTADO_SOLICITUD_TONE[s.estado] ?? {
              label: s.estado,
              tone: 'neutral' as const,
            };

            return (
              <div
                key={s.id}
                data-testid={`fila-solicitud-${s.id}`}
                className="flex flex-col justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:px-5"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{s.disciplina.nombre}</span>
                    <span className="text-xs text-slate-400">
                      · {s.categoriaDisciplina?.nombre ?? 'General'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 tabular-nums">{fecha}</p>
                </div>

                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <PortalTag tone={meta.tone} dot>
                    {meta.label}
                  </PortalTag>
                  {s.motivoRechazo ? (
                    <span className="text-xs font-medium text-rose-400">{s.motivoRechazo}</span>
                  ) : s.estado === 'PENDIENTE' ? (
                    <span className="text-xs text-slate-400">En revisión por secretaría</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </PortalSurface>
      )}

      {disciplinaSeleccionada && (
        <PortalSolicitarInscripcionModal
          disciplina={disciplinaSeleccionada}
          open={Boolean(disciplinaSeleccionada)}
          onClose={() => setDisciplinaSeleccionada(null)}
          esSocio={catalogo?.esSocio}
        />
      )}
    </div>
  );
}
