import { useRef, useState } from 'react';
import { Check, ExternalLink, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DateInput, Modal, ModalActions, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { isoADisplay } from '@/lib/utils/fecha';
import { requiereVencimiento, type TipoDocumentacionDisciplina } from '@/features/disciplinas/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useCrearDocumentacion,
  useDocumentacionPorPersona,
  useEstadoDocumental,
  useRevisarDocumento,
} from '../hooks/useDocumentacion';
import type { EstadoDeDocumento, EstadoDocumentalInscripcion } from '../types';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge, EstadoRevisionBadge } from './EstadoBadges';
import { ModalHabilitacionExcepcional } from './ModalHabilitacionExcepcional';

/** Fecha local de hoy (YYYY-MM-DD) como mínimo del calendario. */
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

interface DocumentacionParticipanteProps {
  persona: { id: number; nombre?: string; apellido?: string };
  /** Si es false, solo se muestra el estado (sin el alta). */
  puedeCargar?: boolean;
}

/**
 * US-24/25 — Documentación obligatoria de un participante: por cada
 * inscripción, lo que se le exige (disciplina + categoría, configurado en
 * Disciplinas) y en qué estado está; y el alta de un documento, eligiendo el
 * tipo entre los exigidos. Un documento nuevo del mismo tipo renueva al anterior.
 */
export function DocumentacionParticipante({ persona, puedeCargar = true }: DocumentacionParticipanteProps) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles.includes('ADMIN') ?? false;
  const esRevisor = usuario?.roles.some((r) => r === 'ADMIN' || r === 'DELEGADO') ?? false;
  const esSocio = (usuario?.roles.includes('SOCIO') ?? false) || usuario?.persona?.id === persona.id;
  const crear = useCrearDocumentacion();
  const revisar = useRevisarDocumento();
  const { data: estado, isLoading, isError } = useEstadoDocumental(persona?.id ?? null);
  const { data: historial } = useDocumentacionPorPersona(persona.id);
  const [docARechazar, setDocARechazar] = useState<{ id: number; etiqueta: string } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [inscripcionAHabilitar, setInscripcionAHabilitar] = useState<EstadoDocumentalInscripcion | null>(null);
  const [docSeleccionado, setDocSeleccionado] = useState<{
    tipoDocumento: TipoDocumentacionDisciplina;
    etiqueta: string;
  } | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const formularioRef = useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docSeleccionado) return;

    const pideVencimiento = requiereVencimiento(docSeleccionado.tipoDocumento);
    if (pideVencimiento && !fechaVencimiento) {
      setErrorFecha('La fecha de vencimiento es obligatoria');
      return;
    }
    if (fechaVencimiento && fechaVencimiento < hoyISO()) {
      setErrorFecha('La fecha de vencimiento no puede ser anterior a la fecha actual');
      return;
    }
    if (!archivo) {
      setErrorArchivo('El archivo es obligatorio');
      return;
    }

    try {
      await crear.mutateAsync({
        payload: {
          tipoDocumento: docSeleccionado.tipoDocumento,
          ...(fechaVencimiento ? { fechaVencimiento } : {}),
          personaId: persona.id,
        },
        archivo,
      });
      toast.success('Documentación cargada correctamente');
      setDocSeleccionado(null);
      setFechaVencimiento('');
      setErrorFecha(null);
      setArchivo(null);
      setFileKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación');
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (isError || !estado) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          {esSocio ? 'No tenés documentación pendiente ni inscripciones activas.' : 'No se registran inscripciones o documentación activa para este participante.'}
        </p>
        {historial && historial.length > 0 && (
          <details className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700 select-none">
              Historial de documentación presentada ({historial.length})
            </summary>
            <ul className="mt-2 divide-y divide-slate-200">
              {historial.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span>
                    {doc.tipo}
                    {doc.archivoNombre && (
                      <a
                        href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-brand-700 hover:underline"
                      >
                        (ver archivo)
                      </a>
                    )}
                    <EstadoRevisionBadge doc={doc} />
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {doc.fechaVencimiento ? `Vence: ${isoADisplay(doc.fechaVencimiento)}` : 'Sin vencimiento'}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {estado.inscripciones.length === 0 ? (
        <p className="text-sm text-slate-500">{esSocio ? 'No estás inscripto en ninguna disciplina activa.' : 'El participante no está inscripto en ninguna disciplina activa.'}</p>
      ) : (
        estado.inscripciones.map((insc) => (
          <section key={insc.inscripcionId} aria-label={`Documentación para ${insc.disciplina.nombre}`} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                {insc.disciplina.nombre}
                {insc.categoriaDisciplina && <span className="font-normal text-slate-500"> · {insc.categoriaDisciplina.nombre}</span>}
              </h3>
              <EstadoHabilitacionBadge estado={insc.estado} />
            </div>
            {insc.estado === 'BLOQUEADO' && insc.motivos && insc.motivos.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">Inscripción bloqueada por documentación:</p>
                  {esAdmin && (
                    insc.yaHabilitadoExcepcionalmente ? (
                      <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800">
                        Excepción única ya utilizada
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-800 hover:bg-rose-100"
                        onClick={() => setInscripcionAHabilitar(insc)}
                      >
                        Habilitar excepcionalmente
                      </Button>
                    )
                  )}
                </div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {insc.motivos.map((motivo) => (
                    <li key={motivo}>{motivo}</li>
                  ))}
                </ul>
              </div>
            )}
            {insc.habilitadoExcepcionalmenteHasta && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
                <p>
                  Habilitado excepcionalmente hasta el {isoADisplay(insc.habilitadoExcepcionalmenteHasta)}.
                </p>
              </div>
            )}
            {insc.documentos.length === 0 ? (
              <p className="text-sm text-slate-500">No exige documentación.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {insc.documentos.map((doc) => {
                  const candidatosPendientes = esRevisor
                    ? (historial ?? []).filter(
                        (h) =>
                          h.estadoRevision === 'PENDIENTE_REVISION' &&
                          (h.tipoDocumento === doc.tipoDocumento || h.tipo === doc.etiqueta),
                      )
                    : [];
                  const docPendiente =
                    candidatosPendientes.length > 0
                      ? [...candidatosPendientes].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]
                      : null;

                  return (
                    <li
                      key={doc.tipoDocumento}
                      className="px-3.5 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-slate-800">
                          <span className="font-medium">{doc.etiqueta}</span>
                          {doc.origen === 'CATEGORIA' && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              (de la categoría)
                            </span>
                          )}
                          {docPendiente ? (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              Subido por el titular ·{' '}
                              {docPendiente.fechaVencimiento
                                ? `Vence el ${isoADisplay(docPendiente.fechaVencimiento)}`
                                : 'Sin vencimiento'}
                            </span>
                          ) : (
                            <span
                              className={`mt-0.5 block text-xs ${
                                doc.estado === 'FALTANTE'
                                  ? 'text-amber-700'
                                  : doc.estado === 'VENCIDO'
                                    ? 'text-rose-600'
                                    : 'text-slate-500'
                              }`}
                            >
                              {doc.estado === 'FALTANTE'
                                ? `Faltante · ${detalleDocumento(doc)}`
                                : doc.estado === 'VENCIDO'
                                  ? `Vencido · ${detalleDocumento(doc)}`
                                  : detalleDocumento(doc)}
                            </span>
                          )}
                        </span>

                        {docPendiente ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
                            Pendiente de revisión
                          </span>
                        ) : puedeCargar && doc.estado !== 'VIGENTE' ? (
                          <Button
                            type="button"
                            variant={
                              docSeleccionado?.tipoDocumento === doc.tipoDocumento
                                ? 'secondary'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => elegirParaCargar(doc.tipoDocumento, doc.etiqueta)}
                          >
                            <Upload size={13} aria-hidden="true" />
                            {doc.estado === 'FALTANTE' ? 'Cargar' : 'Renovar'}
                          </Button>
                        ) : (
                          <EstadoDocumentoBadge estado={doc.estado} />
                        )}
                      </div>

                      {docPendiente && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                          <a
                            href={`${env.apiUrl}/documentacion/${docPendiente.id}/archivo`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                          >
                            <FileText size={13} aria-hidden="true" />
                            Ver archivo adjunto
                            <ExternalLink size={11} aria-hidden="true" />
                          </a>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={revisar.isPending}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => {
                                setDocARechazar({ id: docPendiente.id, etiqueta: doc.etiqueta });
                                setMotivoRechazo('');
                                setErrorMotivo(null);
                              }}
                              aria-label={`Rechazar ${doc.etiqueta}`}
                            >
                              <X size={13} aria-hidden="true" /> Rechazar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={revisar.isPending}
                              className="border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={() =>
                                revisar.mutate({ id: docPendiente.id, aprobar: true })
                              }
                              aria-label={`Aprobar ${doc.etiqueta}`}
                            >
                              <Check size={13} aria-hidden="true" /> Aprobar
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}

      {puedeCargar && docSeleccionado && (
        <section
          aria-labelledby={`doc-nueva-${persona.id}`}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
        >
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 id={`doc-nueva-${persona.id}`} className="text-sm font-semibold text-slate-800">
              Cargar documentación
            </h3>
            <button
              type="button"
              onClick={cancelarCarga}
              aria-label="Cerrar carga de documentación"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <form ref={formularioRef} className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <strong className="text-slate-900">{docSeleccionado.etiqueta}</strong>
            </div>

            {requiereVencimiento(docSeleccionado.tipoDocumento) && (
              <div>
                <DateInput
                  id={`fechaVencimiento-${persona.id}`}
                  label="Fecha de vencimiento *"
                  min={hoyISO()}
                  error={errorFecha ?? undefined}
                  value={fechaVencimiento}
                  onChange={(v) => {
                    setFechaVencimiento(v);
                    if (errorFecha) setErrorFecha(null);
                  }}
                />
              </div>
            )}

            <div>
              <label htmlFor={`archivo-${persona.id}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                Archivo (PDF o imagen) *
              </label>
              <input
                id={`archivo-${persona.id}`}
                key={fileKey}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  setArchivo(e.target.files?.[0] ?? null);
                  if (errorArchivo) setErrorArchivo(null);
                }}
                className="sr-only"
              />
              {archivo ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                      <FileText size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{archivo.name}</p>
                      <p className="text-xs text-slate-500">
                        {(archivo.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar archivo seleccionado"
                    onClick={() => {
                      setArchivo(null);
                      setFileKey((k) => k + 1);
                    }}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`archivo-${persona.id}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(true);
                  }}
                  onDragLeave={() => setArrastrandoArchivo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastrandoArchivo(false);
                    const file = e.dataTransfer.files?.[0] ?? null;
                    if (file) {
                      setArchivo(file);
                      if (errorArchivo) setErrorArchivo(null);
                    }
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
                    arrastrandoArchivo
                      ? 'border-brand-500 bg-brand-50/50'
                      : errorArchivo
                        ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
                        : 'border-slate-300 bg-slate-50/50 hover:border-brand-400 hover:bg-slate-50'
                  }`}
                >
                  <Upload size={18} className="text-slate-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-700">
                    Elegí un archivo <span className="font-normal text-slate-500">o arrastralo acá</span>
                  </p>
                  <p className="text-xs text-slate-400">PDF, JPG, PNG o WEBP · Ningún archivo seleccionado</p>
                </label>
              )}
              {errorArchivo && <p className="mt-1 text-xs text-rose-600">{errorArchivo}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={cancelarCarga}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? 'Subiendo…' : 'Subir'}
              </Button>
            </div>
          </form>
        </section>
      )}

      {historial && historial.length > 0 && (
        <details className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">Historial de documentos ({historial.length})</summary>
          <ul className="mt-2 divide-y divide-slate-100">
            {historial.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-slate-700">
                  {doc.tipo}
                  {doc.archivoNombre && (
                    <a
                      href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-brand-700 hover:underline"
                    >
                      (ver archivo)
                    </a>
                  )}
                  <EstadoRevisionBadge doc={doc} />
                </span>
                <span className="flex shrink-0 items-center gap-2 text-slate-500">
                  <span>
                    {doc.fechaVencimiento ? `Vence: ${isoADisplay(doc.fechaVencimiento)}` : 'Sin vencimiento'}
                  </span>
                  {esRevisor && doc.estadoRevision === 'PENDIENTE_REVISION' && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={revisar.isPending}
                        className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => {
                          setDocARechazar({ id: doc.id, etiqueta: doc.tipo });
                          setMotivoRechazo('');
                          setErrorMotivo(null);
                        }}
                      >
                        <X size={12} aria-hidden="true" /> Rechazar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={revisar.isPending}
                        className="h-7 border-emerald-200 bg-emerald-50/70 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
                        onClick={() => revisar.mutate({ id: doc.id, aprobar: true })}
                      >
                        <Check size={12} aria-hidden="true" /> Aprobar
                      </Button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {inscripcionAHabilitar && (
        <ModalHabilitacionExcepcional
          open={!!inscripcionAHabilitar}
          onClose={() => setInscripcionAHabilitar(null)}
          inscripcionId={inscripcionAHabilitar.inscripcionId}
          personaId={persona.id}
          participanteNombre={`${persona.apellido}, ${persona.nombre}`}
          disciplinaNombre={inscripcionAHabilitar.disciplina.nombre}
          categoriaNombre={inscripcionAHabilitar.categoriaDisciplina?.nombre}
          motivos={inscripcionAHabilitar.motivos}
        />
      )}

      <Modal
        open={Boolean(docARechazar)}
        onClose={() => {
          setDocARechazar(null);
          setErrorMotivo(null);
        }}
        title="Rechazar documento"
        description={
          docARechazar
            ? `${docARechazar.etiqueta} de ${persona.nombre} ${persona.apellido}. Le vamos a avisar por email con el motivo para que lo vuelva a subir.`
            : undefined
        }
        icon={<X size={16} />}
        size="md"
      >
        <label htmlFor={`motivo-rechazo-${persona.id}`} className="mb-1.5 block text-sm font-medium text-slate-700">
          Motivo
        </label>
        <textarea
          id={`motivo-rechazo-${persona.id}`}
          rows={3}
          value={motivoRechazo}
          onChange={(e) => setMotivoRechazo(e.target.value)}
          placeholder="Ej.: la foto está borrosa y no se lee la fecha de vencimiento."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
        {errorMotivo && <p className="mt-1 text-xs text-red-600">{errorMotivo}</p>}
        <ModalActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDocARechazar(null);
              setErrorMotivo(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={revisar.isPending}
            onClick={async () => {
              if (!docARechazar) return;
              if (motivoRechazo.trim().length < 5) {
                setErrorMotivo('Contale al titular qué corregir (al menos 5 caracteres).');
                return;
              }
              await revisar.mutateAsync({
                id: docARechazar.id,
                aprobar: false,
                motivo: motivoRechazo.trim(),
              });
              setDocARechazar(null);
              setMotivoRechazo('');
              setErrorMotivo(null);
            }}
          >
            Confirmar rechazo
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
