import { useRef, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { env } from '@/config/env';
import {
  requiereVencimiento,
  type TipoDocumentacionDisciplina,
} from '@/features/disciplinas/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useCrearDocumentacion,
  useDocumentacionPorPersona,
  useEstadoDocumental,
} from '@/features/documentacion/hooks/useDocumentacion';
import type {
  EstadoDeDocumento,
  EstadoDocumento,
  EstadoHabilitacion,
} from '@/features/documentacion/types';
import { isoADisplay } from '@/lib/utils/fecha';
import {
  PortalButton,
  PortalEmptyState,
  PortalFieldInput,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

function hoyISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function detalleDocumento(doc: EstadoDeDocumento): string {
  if (doc.estado === 'FALTANTE') {
    return doc.fechaLimite ? `Presentar hasta el ${isoADisplay(doc.fechaLimite)}` : 'Sin presentar';
  }
  return doc.fechaVencimiento ? `Vence el ${isoADisplay(doc.fechaVencimiento)}` : 'Sin vencimiento';
}

const DOC_TONE: Record<
  EstadoDocumento,
  { label: string; tone: 'active' | 'pending' | 'danger' | 'neutral' }
> = {
  VIGENTE: { label: 'Vigente', tone: 'active' },
  POR_VENCER: { label: 'Por vencer', tone: 'pending' },
  VENCIDO: { label: 'Vencido', tone: 'danger' },
  FALTANTE: { label: 'Faltante', tone: 'danger' },
};

const HABILITACION_TONE: Record<
  EstadoHabilitacion,
  { label: string; tone: 'active' | 'pending' | 'danger' }
> = {
  HABILITADO: { label: 'Habilitado', tone: 'active' },
  PENDIENTE: { label: 'Pendiente', tone: 'pending' },
  BLOQUEADO: { label: 'Bloqueado', tone: 'danger' },
};

/**
 * Documentación 100% nativa en tema oscuro + azul para Socios y Participantes.
 * No reutiliza ni envuelve DocumentacionParticipante ni hacks CSS.
 */
export function PortalDocumentacionPage() {
  const { usuario } = useAuth();
  const personaId = usuario?.persona?.id ?? null;

  const { data: estado, isLoading, isError } = useEstadoDocumental(personaId);
  const { data: historial } = useDocumentacionPorPersona(personaId);
  const crear = useCrearDocumentacion();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [docSeleccionado, setDocSeleccionado] = useState<{
    tipoDocumento: TipoDocumentacionDisciplina;
    etiqueta: string;
  } | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);

  function elegirParaCargar(tipo: TipoDocumentacionDisciplina, etiqueta: string) {
    setDocSeleccionado({ tipoDocumento: tipo, etiqueta });
    setFechaVencimiento('');
    setErrorFecha(null);
    setErrorArchivo(null);
    setArchivo(null);
    setFileKey((k) => k + 1);
    setTimeout(() => {
      formularioRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  function cancelarCarga() {
    setDocSeleccionado(null);
    setFechaVencimiento('');
    setErrorFecha(null);
    setErrorArchivo(null);
    setArchivo(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docSeleccionado || !personaId) return;

    const pideVencimiento = requiereVencimiento(docSeleccionado.tipoDocumento);
    if (pideVencimiento && !fechaVencimiento) {
      setErrorFecha('La fecha de vencimiento es obligatoria.');
      return;
    }
    if (fechaVencimiento && fechaVencimiento < hoyISO()) {
      setErrorFecha('La fecha de vencimiento no puede ser anterior a hoy.');
      return;
    }
    if (!archivo) {
      setErrorArchivo('Seleccioná un archivo PDF o imagen.');
      return;
    }

    try {
      await crear.mutateAsync({
        payload: {
          tipoDocumento: docSeleccionado.tipoDocumento,
          ...(fechaVencimiento ? { fechaVencimiento } : {}),
          personaId,
        },
        archivo,
      });
      toast.success('Documentación cargada correctamente.');
      cancelarCarga();
      setFileKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación.');
    }
  }

  return (
    <div className="space-y-6">
      <PortalTitleBar
        title="Mi documentación"
        summary="Controlá requisitos médicos o federativos exigidos por disciplina y renová certificados."
      />

      {!personaId ? (
        <PortalEmptyState
          icon={<FolderOpen size={20} />}
          title="Todavía no registrás inscripciones ni documentación"
          description="Cuando te asocies o te inscribas a una disciplina deportiva, aquí verás tus requisitos documentales."
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : isError || !estado ? (
        <PortalSurface className="space-y-4 p-5">
          <p className="text-sm text-slate-300">
            No tenés documentación pendiente ni inscripciones activas.
          </p>
          {historial && historial.length > 0 && (
            <div className="space-y-2 border-t border-slate-300/[0.08] pt-4">
              <p className="text-xs font-semibold text-blue-300">
                Historial presentado ({historial.length})
              </p>
              <ul className="divide-y divide-slate-300/[0.08] rounded-[5px] border border-slate-300/[0.10] bg-[#070b14]">
                {historial.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-medium text-slate-200">
                      {doc.tipo}
                      {doc.archivoNombre && (
                        <a
                          href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <span>Ver archivo</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {doc.fechaVencimiento
                        ? `Vence: ${isoADisplay(doc.fechaVencimiento)}`
                        : 'Sin vencimiento'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PortalSurface>
      ) : (
        <div className="space-y-5">
          {estado.inscripciones.length === 0 ? (
            <PortalEmptyState
              icon={<FileCheck2 size={20} />}
              title="Sin inscripciones activas"
              description="No estás inscripto en ninguna disciplina que exija documentación en este momento."
            />
          ) : (
            <div className="space-y-4">
              {estado.inscripciones.map((insc) => {
                const habMeta = HABILITACION_TONE[insc.estado];
                return (
                  <PortalSurface key={insc.inscripcionId} className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300/[0.08] bg-[#070b14] px-4 py-3.5 sm:px-5">
                      <div>
                        <h2 className="text-sm font-semibold text-white">
                          {insc.disciplina.nombre}
                          {insc.categoriaDisciplina && (
                            <span className="font-normal text-slate-400">
                              {' '}
                              · {insc.categoriaDisciplina.nombre}
                            </span>
                          )}
                        </h2>
                      </div>
                      <PortalTag tone={habMeta.tone} dot>
                        {habMeta.label}
                      </PortalTag>
                    </div>

                    <div className="space-y-3 p-4 sm:p-5">
                      {insc.estado === 'BLOQUEADO' && insc.motivos?.length > 0 && (
                        <div
                          role="alert"
                          className="flex items-start gap-2.5 rounded-[5px] border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
                        >
                          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                          <div>
                            <p className="font-semibold">Inscripción bloqueada por documentación:</p>
                            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-rose-300">
                              {insc.motivos.map((m) => (
                                <li key={m}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {insc.habilitadoExcepcionalmenteHasta && (
                        <div className="rounded-[5px] border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                          Habilitado excepcionalmente hasta el{' '}
                          <span className="tabular-nums">
                            {isoADisplay(insc.habilitadoExcepcionalmenteHasta)}
                          </span>
                          .
                        </div>
                      )}

                      {insc.documentos.length === 0 ? (
                        <p className="text-xs text-slate-400">Esta disciplina no exige documentación.</p>
                      ) : (
                        <ul className="divide-y divide-slate-300/[0.08] rounded-[5px] border border-slate-300/[0.10] bg-[#070b14]">
                          {insc.documentos.map((doc) => {
                            const docMeta = DOC_TONE[doc.estado];
                            const isSelected = docSeleccionado?.tipoDocumento === doc.tipoDocumento;

                            return (
                              <li
                                key={doc.tipoDocumento}
                                className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3 text-sm"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-100">
                                    {doc.etiqueta}
                                    {doc.origen === 'CATEGORIA' && (
                                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                                        (por categoría)
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                                    {detalleDocumento(doc)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <PortalTag tone={docMeta.tone} dot>
                                    {docMeta.label}
                                  </PortalTag>
                                  {doc.estado !== 'VIGENTE' && (
                                    <PortalButton
                                      variant={isSelected ? 'primary' : 'secondary'}
                                      size="sm"
                                      onClick={() => elegirParaCargar(doc.tipoDocumento, doc.etiqueta)}
                                    >
                                      <Upload size={13} />
                                      {doc.estado === 'FALTANTE' ? 'Cargar' : 'Renovar'}
                                    </PortalButton>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </PortalSurface>
                );
              })}
            </div>
          )}

          {/* Formulario inline nativo oscuro para carga o renovación */}
          {docSeleccionado && (
            <PortalSurface className="border-blue-400/35 bg-[#0b1322] p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-blue-400/15 pb-3">
                <div className="flex items-center gap-2">
                  <FilePlus2 size={16} className="text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Presentar: <span className="text-blue-300">{docSeleccionado.etiqueta}</span>
                  </h3>
                </div>
                <PortalButton variant="ghost" size="sm" onClick={cancelarCarga}>
                  Cancelar
                </PortalButton>
              </div>

              <form ref={formularioRef} className="space-y-4" onSubmit={onSubmit} noValidate>
                {requiereVencimiento(docSeleccionado.tipoDocumento) && (
                  <PortalFieldInput
                    id={`fechaVencimiento-${personaId}`}
                    type="date"
                    label="Fecha de vencimiento *"
                    min={hoyISO()}
                    error={errorFecha ?? undefined}
                    value={fechaVencimiento}
                    onChange={(e) => {
                      setFechaVencimiento(e.target.value);
                      if (errorFecha) setErrorFecha(null);
                    }}
                  />
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor={`archivo-${personaId}`}
                    className="block text-xs font-medium text-slate-300"
                  >
                    Archivo (PDF o imagen) *
                  </label>
                  <input
                    id={`archivo-${personaId}`}
                    key={fileKey}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      setArchivo(e.target.files?.[0] ?? null);
                      if (errorArchivo) setErrorArchivo(null);
                    }}
                    className="block w-full rounded-[5px] border border-slate-300/[0.15] bg-[#070b14] p-2 text-xs text-slate-300 file:mr-3 file:rounded-[4px] file:border file:border-blue-400/30 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {errorArchivo && <p className="text-xs text-rose-400">{errorArchivo}</p>}
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <PortalButton variant="secondary" size="sm" onClick={cancelarCarga}>
                    Cancelar
                  </PortalButton>
                  <PortalButton type="submit" variant="primary" size="sm" disabled={crear.isPending}>
                    <Upload size={14} />
                    {crear.isPending ? 'Subiendo archivo…' : 'Cargar documentación'}
                  </PortalButton>
                </div>
              </form>
            </PortalSurface>
          )}

          {/* Historial de archivos cargados */}
          {historial && historial.length > 0 && (
            <PortalSurface variant="muted" className="p-4">
              <p className="mb-2.5 text-xs font-semibold text-slate-300">
                Historial de archivos presentados ({historial.length})
              </p>
              <ul className="divide-y divide-slate-300/[0.08]">
                {historial.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-200">
                      {doc.tipo}
                      {doc.archivoNombre && (
                        <a
                          href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2.5 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <span>Ver archivo</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {doc.fechaVencimiento
                        ? `Vence: ${isoADisplay(doc.fechaVencimiento)}`
                        : 'Sin vencimiento'}
                    </span>
                  </li>
                ))}
              </ul>
            </PortalSurface>
          )}
        </div>
      )}
    </div>
  );
}
