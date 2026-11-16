import { useState, useMemo } from 'react';
import { CalendarClock, Filter, AlertCircle, FileText, Ban, Upload } from 'lucide-react';
import { Button, ConfirmDialog, Select } from '@/components/ui';
import { EstadoSolicitudBadge } from './EstadoSolicitudBadge';
import type {
  DocumentoRequeridoCatalogo,
  SolicitudInscripcion,
  EstadoSolicitudInscripcion,
} from '../types';
import type { TipoDocumentacionDisciplina } from '@/features/disciplinas/types';
import { SubirDocumentacionSolicitudModal } from './SubirDocumentacionSolicitudModal';

type FiltroEstado = 'TODOS' | EstadoSolicitudInscripcion;

interface Props {
  solicitudes: SolicitudInscripcion[];
  filtroEstado?: FiltroEstado;
  onCambiarFiltro?: (estado: FiltroEstado) => void;
  onCancelar?: (solicitudId: number) => Promise<unknown>;
  cancelando?: boolean;
  onSubirDocumentacion?: (
    solicitudId: number,
    payload: { tipoDocumento: TipoDocumentacionDisciplina; fechaVencimiento?: string },
    archivo: File,
  ) => Promise<unknown>;
  obtenerDocumentosSolicitud?: (
    solicitud: SolicitudInscripcion,
  ) => DocumentoRequeridoCatalogo[];
}

const OPCIONES_FILTRO: { value: FiltroEstado; label: string }[] = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'En revisión' },
  { value: 'PENDIENTE_DOCUMENTACION', label: 'Pendiente de documentación' },
  { value: 'APROBADA', label: 'Aprobadas' },
  { value: 'RECHAZADA', label: 'Rechazadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

export function MisSolicitudesInscripcionTable({
  solicitudes,
  filtroEstado: filtroProp,
  onCambiarFiltro,
  onCancelar,
  cancelando = false,
  onSubirDocumentacion,
  obtenerDocumentosSolicitud,
}: Props) {
  const [filtroLocal, setFiltroLocal] = useState<FiltroEstado>('TODOS');
  const [solicitudAConfirmar, setSolicitudAConfirmar] = useState<SolicitudInscripcion | null>(null);
  const [solicitudDocumentacion, setSolicitudDocumentacion] = useState<SolicitudInscripcion | null>(null);

  const filtroActual = filtroProp ?? filtroLocal;
  const setFiltro = (nuevo: FiltroEstado) => {
    if (onCambiarFiltro) {
      onCambiarFiltro(nuevo);
    } else {
      setFiltroLocal(nuevo);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    if (filtroActual === 'TODOS') return solicitudes;
    return solicitudes.filter((s) => s.estado === filtroActual);
  }, [solicitudes, filtroActual]);

  const sinSolicitudesTotales = solicitudes.length === 0 && filtroActual === 'TODOS';
  const sinSolicitudesPorFiltro = solicitudesFiltradas.length === 0 && !sinSolicitudesTotales;

  return (
    <div className="space-y-4" data-testid="seccion-mis-solicitudes">
      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="w-full sm:w-72">
          <Select
            aria-label="Filtrar por estado"
            value={filtroActual}
            onChange={(e) => setFiltro(e.target.value as FiltroEstado)}
            leftIcon={<Filter className="h-4 w-4" />}
            data-testid="filtro-estado-solicitudes"
          >
            {OPCIONES_FILTRO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-slate-500">
          Mostrando {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
        </p>
      </div>

      {sinSolicitudesTotales ? (
        <div
          className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs"
          data-testid="sin-solicitudes"
        >
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="font-medium text-slate-700">Todavía no enviaste ninguna solicitud de inscripción.</p>
          <p className="mt-1 text-sm text-slate-500">
            Explorá el catálogo de disciplinas activas para postularte a las actividades del club.
          </p>
        </div>
      ) : sinSolicitudesPorFiltro ? (
        <div
          className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-xs"
          data-testid="sin-solicitudes-filtro"
        >
          <Filter className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="font-medium text-slate-700">No hay solicitudes para el filtro seleccionado.</p>
          <p className="mt-1 text-sm text-slate-500">
            Probá seleccionando otro estado o «Todos los estados» para ver tu historial completo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm text-slate-600" data-testid="tabla-mis-solicitudes">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">Disciplina</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Fecha y hora</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Detalle / Motivo</th>
                {onCancelar && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudesFiltradas.map((s) => {
                const fecha = new Date(s.fechaSolicitud);
                const fechaFormateada = fecha.toLocaleDateString('es-AR', {
                  timeZone: 'America/Argentina/Buenos_Aires',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr
                    key={s.id}
                    className="align-middle transition-colors hover:bg-slate-50"
                    data-testid={`fila-solicitud-${s.id}`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.disciplina.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.categoriaDisciplina?.nombre ?? 'General'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {fechaFormateada}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoSolicitudBadge estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {s.estado === 'RECHAZADA' && (
                        <div
                          className="flex items-start gap-1.5 rounded-md bg-rose-50 p-2 text-rose-800 border border-rose-200"
                          data-testid={`motivo-rechazo-${s.id}`}
                          role="alert"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                          <div>
                            <span className="font-semibold block text-rose-900">Motivo del rechazo:</span>
                            <span>{s.motivoRechazo || 'Sin motivo especificado por la administración'}</span>
                          </div>
                        </div>
                      )}
                      {['PENDIENTE', 'PENDIENTE_DOCUMENTACION', 'APROBADA'].includes(s.estado) && (
                        <span className="text-slate-500">En revisión por la administración</span>
                      )}
                      {s.estado === 'PENDIENTE_DOCUMENTACION' && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                          <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Se requiere cargar documentación obligatoria</span>
                        </div>
                      )}
                      {s.estado === 'APROBADA' && (
                        <span className="text-emerald-700 font-medium">Inscripción activa en la actividad</span>
                      )}
                      {s.estado === 'CANCELADA' && (
                        <span className="text-slate-400">Solicitud dada de baja o cancelada</span>
                      )}
                    </td>
                    {onCancelar && (
                      <td className="px-4 py-3 text-right">
                        {['PENDIENTE', 'PENDIENTE_DOCUMENTACION', 'APROBADA'].includes(s.estado) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            data-testid="btn-cancelar-solicitud"
                            onClick={() => setSolicitudAConfirmar(s)}
                            disabled={cancelando}
                          >
                            <Ban size={14} aria-hidden="true" />
                            Cancelar
                          </Button>
                        )}
                        {onSubirDocumentacion &&
                          ['PENDIENTE', 'PENDIENTE_DOCUMENTACION'].includes(s.estado) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              data-testid="btn-subir-documentacion-solicitud"
                              onClick={() => setSolicitudDocumentacion(s)}
                            >
                              <Upload size={14} aria-hidden="true" />
                              Documentación
                            </Button>
                          )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {onCancelar && (
        <ConfirmDialog
          open={solicitudAConfirmar !== null}
          title="¿Cancelar solicitud de inscripción?"
          description="La solicitud se cancelará y, si ya estaba aprobada, también se dará de baja la inscripción vigente."
          confirmLabel="Sí, cancelar solicitud"
          cancelLabel="Volver"
          variant="danger"
          loading={cancelando}
          onCancel={() => setSolicitudAConfirmar(null)}
          onConfirm={() => {
            if (!solicitudAConfirmar) return;
            void onCancelar(solicitudAConfirmar.id).then(() => setSolicitudAConfirmar(null));
          }}
        >
          <p data-testid="modal-confirmar-cancelacion" className="text-sm text-slate-600">
            Disciplina: <strong>{solicitudAConfirmar?.disciplina.nombre}</strong>
          </p>
        </ConfirmDialog>
      )}
      {onSubirDocumentacion && (
        <SubirDocumentacionSolicitudModal
          solicitud={solicitudDocumentacion}
          onClose={() => setSolicitudDocumentacion(null)}
          onSubmit={onSubirDocumentacion}
          documentos={
            solicitudDocumentacion && obtenerDocumentosSolicitud
              ? obtenerDocumentosSolicitud(solicitudDocumentacion)
              : []
          }
        />
      )}
    </div>
  );
}
