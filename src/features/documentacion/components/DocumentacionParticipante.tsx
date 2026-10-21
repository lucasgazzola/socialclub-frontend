import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button, DateInput, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { isoADisplay } from '@/lib/utils/fecha';
import { requiereVencimiento, type TipoDocumentacionDisciplina } from '@/features/disciplinas/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCrearDocumentacion, useDocumentacionPorPersona, useEstadoDocumental } from '../hooks/useDocumentacion';
import type { EstadoDeDocumento, EstadoDocumentalInscripcion } from '../types';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge } from './EstadoBadges';
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
  const esSocio = (usuario?.roles.includes('SOCIO') ?? false) || usuario?.persona?.id === persona.id;
  const crear = useCrearDocumentacion();
  const { data: estado, isLoading, isError } = useEstadoDocumental(persona?.id ?? null);
  const { data: historial } = useDocumentacionPorPersona(persona.id);
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-800 hover:bg-rose-100"
                      onClick={() => setInscripcionAHabilitar(insc)}
                    >
                      Habilitar excepcionalmente
                    </Button>
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
                {esAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-amber-800 hover:bg-amber-100"
                    onClick={() => setInscripcionAHabilitar(insc)}
                  >
                    Extender habilitación
                  </Button>
                )}
              </div>
            )}
            {insc.documentos.length === 0 ? (
              <p className="text-sm text-slate-500">No exige documentación.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {insc.documentos.map((doc) => (
                  <li key={doc.tipoDocumento} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 text-slate-700">
                      {doc.etiqueta}
                      {doc.origen === 'CATEGORIA' && <span className="ml-1 text-xs text-slate-400">(de la categoría)</span>}
                      <span className="block text-xs text-slate-500">{detalleDocumento(doc)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <EstadoDocumentoBadge estado={doc.estado} />
                      {puedeCargar && doc.estado !== 'VIGENTE' && (
                        <Button
                          type="button"
                          variant={docSeleccionado?.tipoDocumento === doc.tipoDocumento ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => elegirParaCargar(doc.tipoDocumento, doc.etiqueta)}
                        >
                          {doc.estado === 'FALTANTE' ? 'Cargar' : 'Renovar'}
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {puedeCargar && docSeleccionado && (
        <section aria-labelledby={`doc-nueva-${persona.id}`} className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 id={`doc-nueva-${persona.id}`} className="text-sm font-semibold text-slate-800">
              Cargar documentación
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={cancelarCarga}>
              Cancelar
            </Button>
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
              <label htmlFor={`archivo-${persona.id}`} className="mb-1 block text-sm font-medium text-slate-700">
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
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
              {errorArchivo && <p className="mt-1 text-xs text-red-600">{errorArchivo}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={cancelarCarga}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? 'Cargando…' : 'Cargar documentación'}
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
                </span>
                <span className="shrink-0 text-slate-500">
                  {doc.fechaVencimiento ? `Vence: ${isoADisplay(doc.fechaVencimiento)}` : 'Sin vencimiento'}
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
    </div>
  );
}
