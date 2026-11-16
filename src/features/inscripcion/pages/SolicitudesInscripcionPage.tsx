import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  ModalActions,
  Select,
  Spinner,
  StatusTabs,
} from '@/components/ui';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import { formatearDni } from '@/lib/utils/dni';
import { EstadoSolicitudBadge } from '../components/EstadoSolicitudBadge';
import {
  useAprobarSolicitudInscripcion,
  useRechazarSolicitudInscripcion,
  useSolicitudesInscripcionAdmin,
} from '../hooks/useSolicitudesInscripcionAdmin';
import type {
  AprobarSolicitudInscripcionResultado,
  EstadoSolicitudInscripcion,
  SolicitudInscripcionAdmin,
} from '../types';

type PestaniaEstado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function mensajeExitoAprobacion(res: AprobarSolicitudInscripcionResultado): string {
  const estadoInsc =
    res.estadoDocumental?.estado === 'PENDIENTE'
      ? 'Pendiente de documentación'
      : 'Habilitada';
  const cuota = res.cuotaGenerada;
  const textoCuota =
    cuota && !cuota.sinTarifa && cuota.monto !== null
      ? ` Cuota deportiva generada (${cuota.periodo}): $${cuota.monto.toLocaleString('es-AR')}.`
      : ' Se registró el período de cuota deportiva.';
  return `Solicitud aprobada. Inscripción creada en estado «${estadoInsc}».${textoCuota}`;
}

/**
 * US-66 — Evaluar solicitudes de inscripción a una disciplina.
 *
 * Permite al delegado o administrador consultar las solicitudes pendientes,
 * filtrar por disciplina, buscar por nombre/apellido/DNI, verificar si el socio
 * cuenta con la documentación obligatoria o tiene documentos faltantes, y
 * aprobar o rechazar con motivo obligatorio.
 */
export function SolicitudesInscripcionPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<PestaniaEstado>('PENDIENTE');
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [aAprobar, setAAprobar] = useState<SolicitudInscripcionAdmin | null>(null);
  const [aRechazar, setARechazar] = useState<SolicitudInscripcionAdmin | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);

  useEffect(() => {
    const limpio = textoBusqueda.trim();
    if (limpio === busqueda) return;
    const timer = setTimeout(() => {
      setBusqueda(limpio);
    }, 250);
    return () => clearTimeout(timer);
  }, [textoBusqueda, busqueda]);

  const { disciplinas } = useDisciplinasActivas();

  const {
    data: solicitudes = [],
    isLoading,
    isError,
    error,
  } = useSolicitudesInscripcionAdmin({
    estado: estadoFiltro as EstadoSolicitudInscripcion,
    disciplinaId,
    busqueda: busqueda || undefined,
  });

  const aprobarMutation = useAprobarSolicitudInscripcion();
  const rechazarMutation = useRechazarSolicitudInscripcion();

  const confirmarAprobacion = async () => {
    if (!aAprobar) return;
    try {
      const resultado = await aprobarMutation.mutateAsync(aAprobar.id);
      toast.success(mensajeExitoAprobacion(resultado));
      setAAprobar(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo aprobar la solicitud de inscripción.',
      );
    }
  };

  const abrirModalRechazo = (solicitud: SolicitudInscripcionAdmin) => {
    setARechazar(solicitud);
    setMotivoRechazo('');
    setErrorMotivo(null);
  };

  const cerrarModalRechazo = () => {
    setARechazar(null);
    setMotivoRechazo('');
    setErrorMotivo(null);
  };

  const confirmarRechazo = async () => {
    if (!aRechazar) return;
    const limpio = motivoRechazo.trim();
    if (!limpio) {
      setErrorMotivo('El motivo de rechazo es obligatorio.');
      return;
    }
    try {
      await rechazarMutation.mutateAsync({ id: aRechazar.id, motivo: limpio });
      toast.success('Solicitud de inscripción rechazada.');
      cerrarModalRechazo();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo rechazar la solicitud de inscripción.',
      );
    }
  };

  return (
    <div className="space-y-6" data-testid="pagina-evaluar-solicitudes">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Solicitudes de inscripción
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Evaluá las solicitudes de inscripción a disciplinas, verificá la documentación
            obligatoria y aprobá o rechazá cada postulación.
          </p>
        </div>
      </header>

      {/* Controles de estado, búsqueda y filtro por disciplina */}
      <div className="space-y-3">
        <StatusTabs<PestaniaEstado>
          value={estadoFiltro}
          onChange={(nuevo) => setEstadoFiltro(nuevo)}
          aria-label="Estado de las solicitudes"
          tabs={[
            { value: 'PENDIENTE', label: 'Pendientes' },
            { value: 'APROBADA', label: 'Aprobadas' },
            { value: 'RECHAZADA', label: 'Rechazadas' },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Input
              id="busqueda-solicitudes-inscripcion"
              aria-label="Buscar por nombre, apellido o DNI"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Select
              id="filtro-disciplina-solicitudes"
              aria-label="Filtrar por disciplina"
              value={disciplinaId ?? ''}
              onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : undefined)}
              leftIcon={<Filter size={16} />}
              className="w-full sm:w-60"
            >
              <option value="">Todas las disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Listado de solicitudes */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex justify-center py-12" data-testid="spinner-solicitudes-admin">
            <Spinner className="h-6 w-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-700" role="alert">
            {error instanceof Error
              ? error.message
              : 'No se pudieron cargar las solicitudes de inscripción.'}
          </div>
        ) : solicitudes.length === 0 ? (
          <div
            className="p-10 text-center text-sm text-slate-500"
            data-testid="sin-solicitudes-admin"
          >
            <ClipboardCheck className="mx-auto mb-2.5 h-9 w-9 text-slate-300" aria-hidden="true" />
            <p className="font-medium text-slate-700">
              No se encontraron solicitudes de inscripción para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <table
            className="w-full text-left text-sm text-slate-600"
            data-testid="tabla-solicitudes-admin"
          >
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Socio
                </th>
                <th scope="col" className="px-4 py-3">
                  Disciplina y categoría
                </th>
                <th scope="col" className="px-4 py-3">
                  Documentación obligatoria
                </th>
                <th scope="col" className="px-4 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudes.map((s) => {
                const doc = s.documentacion;
                const esPendiente =
                  s.estado === 'PENDIENTE' || s.estado === 'PENDIENTE_DOCUMENTACION';

                return (
                  <tr
                    key={s.id}
                    className="align-top transition-colors hover:bg-slate-50/70"
                    data-testid={`solicitud-inscripcion-${s.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {s.persona.apellido}, {s.persona.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        DNI {formatearDni(s.persona.dni)}
                        {s.persona.email ? ` · ${s.persona.email}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{s.disciplina.nombre}</div>
                      <div className="text-xs text-slate-500">
                        Categoría: {s.categoriaDisciplina?.nombre ?? 'General'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5" data-testid={`doc-solicitud-${s.id}`}>
                      {!doc?.requiereDocumentacion ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>Sin documentación exigida (quedará Habilitada)</span>
                        </div>
                      ) : doc.completa ? (
                        <div className="space-y-1">
                          <Badge variant="success">Documentación completa</Badge>
                          <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                            {doc.documentos.map((d) => (
                              <li key={d.tipoDocumento} className="flex items-center gap-1">
                                <Check size={12} className="shrink-0 text-emerald-600" />
                                <span>{d.etiqueta} (Vigente)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="warning">Documentos faltantes</Badge>
                          <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                            {doc.documentos.map((d) => {
                              const ok = d.estado === 'VIGENTE' || d.estado === 'POR_VENCER';
                              return (
                                <li key={d.tipoDocumento} className="flex items-center gap-1">
                                  {ok ? (
                                    <Check size={12} className="shrink-0 text-emerald-600" />
                                  ) : (
                                    <FileWarning size={12} className="shrink-0 text-amber-600" />
                                  )}
                                  <span className={ok ? 'text-slate-600' : 'font-medium text-amber-800'}>
                                    {d.etiqueta}: {ok ? 'Vigente' : 'Faltante'}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-500">
                      {formatearFechaHora(s.fechaSolicitud)}
                    </td>

                    <td className="px-4 py-3.5">
                      <EstadoSolicitudBadge estado={s.estado} />
                      {s.motivoRechazo && (
                        <div className="mt-1.5 flex items-start gap-1 text-xs text-rose-700">
                          <AlertCircle size={13} className="mt-0.5 shrink-0" />
                          <span>Motivo: {s.motivoRechazo}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {esPendiente ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={aprobarMutation.isPending || rechazarMutation.isPending}
                            onClick={() => setAAprobar(s)}
                            aria-label={`Aprobar solicitud de ${s.persona.nombre} ${s.persona.apellido}`}
                            data-testid={`btn-aprobar-${s.id}`}
                          >
                            <Check size={14} /> Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={aprobarMutation.isPending || rechazarMutation.isPending}
                            onClick={() => abrirModalRechazo(s)}
                            aria-label={`Rechazar solicitud de ${s.persona.nombre} ${s.persona.apellido}`}
                            data-testid={`btn-rechazar-${s.id}`}
                          >
                            <X size={14} /> Rechazar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Evaluada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmación de aprobación */}
      <ConfirmDialog
        open={Boolean(aAprobar)}
        variant="success"
        title="Aprobar solicitud de inscripción"
        description={
          aAprobar
            ? `Se aprobará la solicitud de ${aAprobar.persona.nombre} ${aAprobar.persona.apellido} (DNI ${formatearDni(aAprobar.persona.dni)}) en ${aAprobar.disciplina.nombre}${aAprobar.categoriaDisciplina ? ` (${aAprobar.categoriaDisciplina.nombre})` : ''}. La inscripción quedará en estado «${aAprobar.documentacion?.completa ? 'Habilitada' : 'Pendiente de documentación'}» y se generará la cuota deportiva correspondiente.`
            : undefined
        }
        confirmLabel="Confirmar aprobación"
        loading={aprobarMutation.isPending}
        onConfirm={() => void confirmarAprobacion()}
        onCancel={() => setAAprobar(null)}
      />

      {/* Modal de rechazo con motivo obligatorio */}
      <Modal
        open={Boolean(aRechazar)}
        onClose={cerrarModalRechazo}
        title="Rechazar solicitud de inscripción"
        description={
          aRechazar
            ? `Indicá el motivo por el cual se rechaza la solicitud de ${aRechazar.persona.nombre} ${aRechazar.persona.apellido} para ${aRechazar.disciplina.nombre}${aRechazar.categoriaDisciplina ? ` (${aRechazar.categoriaDisciplina.nombre})` : ''}.`
            : undefined
        }
        icon={<X size={16} />}
        size="md"
      >
        <div className="space-y-2">
          <label
            htmlFor="motivo-rechazo-solicitud"
            className="block text-sm font-medium text-slate-700"
          >
            Motivo del rechazo <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="motivo-rechazo-solicitud"
            rows={3}
            value={motivoRechazo}
            onChange={(e) => {
              setMotivoRechazo(e.target.value);
              if (errorMotivo) setErrorMotivo(null);
            }}
            placeholder="Ej.: La categoría solicitada completó el cupo disponible."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          />
          {errorMotivo && (
            <p className="text-xs font-medium text-rose-600" role="alert">
              {errorMotivo}
            </p>
          )}
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={cerrarModalRechazo}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={rechazarMutation.isPending}
            onClick={() => void confirmarRechazo()}
            data-testid="btn-confirmar-rechazo"
          >
            Confirmar rechazo
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
