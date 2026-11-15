import { useState } from 'react';
import { CalendarClock, Dumbbell, FileText, Users } from 'lucide-react';
import { Spinner } from '@/components/ui';
import {
  useCatalogoInscripcion,
  useMisSolicitudesInscripcion,
} from '@/features/inscripcion/hooks/useSolicitarInscripcion';
import { SolicitarInscripcionModal } from '@/features/inscripcion/components/SolicitarInscripcionModal';
import type {
  DisciplinaCatalogo,
  EstadoSolicitudInscripcion,
} from '@/features/inscripcion/types';
import {
  PortalButton,
  PortalEmptyState,
  PortalPageHeader,
  PortalPanel,
  PortalSegmentedTabs,
  PortalStatusPill,
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
      <PortalPageHeader
        title="Disciplinas e inscripción"
        subtitle="Explorá las actividades deportivas vigentes, compará aranceles y enviá tu solicitud de ingreso."
      />

      <div data-testid="tabs-solicitud-inscripcion">
        <PortalSegmentedTabs<TabView>
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
            <Spinner className="h-7 w-7 text-zinc-400" />
          </div>
        ) : errorCatalogo ? (
          <PortalPanel className="border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
            {errorCatalogo.message || 'No se pudo cargar el catálogo de disciplinas.'}
          </PortalPanel>
        ) : disciplinas.length === 0 ? (
          <PortalEmptyState
            testId="sin-disciplinas-activas"
            icon={<Dumbbell size={22} />}
            title="No hay disciplinas activas disponibles"
            description="Pronto se habilitarán nuevas disciplinas deportivas para inscripción."
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="catalogo-disciplinas-grid"
          >
            {disciplinas.map((d) => {
              const puedeSolicitar = !d.inscripto && !d.solicitudPendiente;

              return (
                <PortalPanel
                  key={d.id}
                  className="flex flex-col justify-between p-5 transition-[border-color,background-color] duration-150 hover:border-white/[0.16] hover:bg-[#11151e]"
                >
                  <div data-testid={`tarjeta-disciplina-${d.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold tracking-[-0.02em] text-white">
                        {d.nombre}
                      </h2>
                      {d.inscripto ? (
                        <PortalStatusPill tone="active" dot>
                          Inscripto
                        </PortalStatusPill>
                      ) : d.solicitudPendiente ? (
                        <PortalStatusPill tone="pending" dot>
                          Pendiente
                        </PortalStatusPill>
                      ) : null}
                    </div>

                    {d.descripcion && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                        {d.descripcion}
                      </p>
                    )}

                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#07090d] px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        Arancel mensual
                      </span>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-xl font-semibold tabular-nums text-white">
                          ${d.arancelMensual.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-zinc-400">/ mes</span>
                      </div>
                      {d.descuentoSocioPorcentaje > 0 && catalogo?.esSocio && (
                        <p className="mt-1 text-[11px] font-medium text-emerald-400">
                          Incluye {d.descuentoSocioPorcentaje}% desc. por ser socio
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-zinc-500 shrink-0" />
                        <span>
                          {d.categorias.length > 0
                            ? `${d.categorias.length} ${d.categorias.length === 1 ? 'categoría activa' : 'categorías activas'}`
                            : 'Sin categorías divididas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-500 shrink-0" />
                        <span>
                          {d.documentosObligatorios.length > 0
                            ? `${d.documentosObligatorios.length} requisitos documentales`
                            : 'Sin documentación obligatoria'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/[0.07] pt-4">
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
                </PortalPanel>
              );
            })}
          </div>
        )
      ) : cargandoSolicitudes ? (
        <div className="flex h-48 items-center justify-center" data-testid="spinner-solicitudes">
          <Spinner className="h-7 w-7 text-zinc-400" />
        </div>
      ) : solicitudes.length === 0 ? (
        <PortalEmptyState
          testId="sin-solicitudes"
          icon={<CalendarClock size={22} />}
          title="Todavía no enviaste solicitudes"
          description="Explorá el catálogo de disciplinas activas para postularte desde tu cuenta."
          action={
            <PortalButton variant="primary" size="sm" onClick={() => setTabActual('catalogo')}>
              Ver catálogo
            </PortalButton>
          }
        />
      ) : (
        <PortalPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="tabla-mis-solicitudes">
              <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5">Disciplina</th>
                  <th className="px-5 py-3.5">Categoría</th>
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
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
                    <tr
                      key={s.id}
                      data-testid={`fila-solicitud-${s.id}`}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        {s.disciplina.nombre}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300">
                        {s.categoriaDisciplina?.nombre ?? 'General'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400 tabular-nums">
                        {fecha}
                      </td>
                      <td className="px-5 py-3.5">
                        <PortalStatusPill tone={meta.tone} dot>
                          {meta.label}
                        </PortalStatusPill>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-400">
                        {s.motivoRechazo ? (
                          <span className="font-medium text-rose-400">{s.motivoRechazo}</span>
                        ) : s.estado === 'PENDIENTE' ? (
                          'En revisión por secretaría'
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PortalPanel>
      )}

      {disciplinaSeleccionada && (
        <SolicitarInscripcionModal
          disciplina={disciplinaSeleccionada}
          open={!!disciplinaSeleccionada}
          onClose={() => setDisciplinaSeleccionada(null)}
          esSocio={catalogo?.esSocio}
        />
      )}
    </div>
  );
}
