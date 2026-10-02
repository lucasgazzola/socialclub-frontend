import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, DateInput, Select, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { isoADisplay } from '@/lib/utils/fecha';
import type { TipoDocumentacionDisciplina } from '@/features/disciplinas/types';
import { useCrearDocumentacion, useDocumentacionPorPersona, useEstadoDocumental } from '../hooks/useDocumentacion';
import { documentacionSchema, type DocumentacionFormValues } from '../schemas/documentacion.schema';
import type { EstadoDeDocumento } from '../types';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge } from './EstadoBadges';

/** Fecha local de hoy (YYYY-MM-DD) como mínimo del calendario. */
function hoyISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function detalleDocumento(doc: EstadoDeDocumento): string {
  if (doc.estado === 'FALTANTE') {
    return doc.fechaLimite ? `Presentar hasta el ${isoADisplay(doc.fechaLimite)}` : 'Sin presentar';
  }
  return doc.fechaVencimiento ? `Vence el ${isoADisplay(doc.fechaVencimiento)}` : '';
}

interface DocumentacionParticipanteProps {
  persona: { id: number; nombre: string; apellido: string };
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
  const crear = useCrearDocumentacion();
  const { data: estado, isLoading } = useEstadoDocumental(persona.id);
  const { data: historial } = useDocumentacionPorPersona(persona.id);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const formularioRef = useRef<HTMLFormElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DocumentacionFormValues>({
    resolver: zodResolver(documentacionSchema),
    defaultValues: { tipoDocumento: '', fechaVencimiento: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await crear.mutateAsync({
        payload: {
          tipoDocumento: values.tipoDocumento as TipoDocumentacionDisciplina,
          fechaVencimiento: values.fechaVencimiento,
          personaId: persona.id,
        },
        archivo,
      });
      toast.success('Documentación cargada correctamente');
      reset({ tipoDocumento: '', fechaVencimiento: '' });
      setArchivo(null);
      setFileKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación');
    }
  });

  function elegirParaCargar(tipo: TipoDocumentacionDisciplina) {
    setValue('tipoDocumento', tipo, { shouldValidate: true });
    formularioRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }

  if (isLoading || !estado) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const exigeAlgo = estado.tiposExigidos.length > 0;

  return (
    <div className="space-y-6">
      {estado.inscripciones.length === 0 ? (
        <p className="text-sm text-slate-500">El participante no está inscripto en ninguna disciplina activa.</p>
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
            {insc.habilitadoExcepcionalmenteHasta && (
              <p className="text-xs text-amber-700">
                Habilitado excepcionalmente hasta el {isoADisplay(insc.habilitadoExcepcionalmenteHasta)}.
              </p>
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
                        <Button type="button" variant="ghost" size="sm" onClick={() => elegirParaCargar(doc.tipoDocumento)}>
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

      {puedeCargar && exigeAlgo && (
        <section aria-labelledby={`doc-nueva-${persona.id}`} className="border-t border-slate-200 pt-5">
          <h3 id={`doc-nueva-${persona.id}`} className="mb-3 text-sm font-semibold text-slate-800">
            Cargar documento
          </h3>
          <form ref={formularioRef} className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor={`tipoDocumento-${persona.id}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipo de documento
              </label>
              <Controller
                control={control}
                name="tipoDocumento"
                render={({ field }) => (
                  <Select id={`tipoDocumento-${persona.id}`} value={field.value} onChange={field.onChange} onBlur={field.onBlur}>
                    <option value="">Seleccioná el tipo</option>
                    {estado.tiposExigidos.map((t) => (
                      <option key={t.tipoDocumento} value={t.tipoDocumento}>
                        {t.etiqueta}
                        {t.documentoActualId ? ' (renovación)' : ''}
                      </option>
                    ))}
                  </Select>
                )}
              />
              {errors.tipoDocumento && <p className="mt-1 text-xs font-medium text-rose-600">{errors.tipoDocumento.message}</p>}
            </div>
            <Controller
              control={control}
              name="fechaVencimiento"
              render={({ field }) => (
                <DateInput
                  id={`fechaVencimiento-${persona.id}`}
                  label="Fecha de vencimiento"
                  min={hoyISO()}
                  error={errors.fechaVencimiento?.message}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <div>
              <label htmlFor={`archivo-${persona.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                Archivo (PDF o imagen, opcional)
              </label>
              <input
                id={`archivo-${persona.id}`}
                key={fileKey}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Cargando…' : 'Cargar documento'}
            </Button>
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
                <span className="shrink-0 text-slate-500">Vence: {isoADisplay(doc.fechaVencimiento)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
