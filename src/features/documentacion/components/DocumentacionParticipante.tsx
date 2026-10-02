import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button, DateInput, Input, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { isoADisplay } from '@/lib/utils/fecha';
import { useCrearDocumentacion, useDocumentacionPorPersona } from '../hooks/useDocumentacion';
import { documentacionSchema, type DocumentacionFormValues } from '../schemas/documentacion.schema';

/** Fecha local de hoy (YYYY-MM-DD) como mínimo del calendario. */
function hoyISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

interface DocumentacionParticipanteProps {
  persona: { id: number; nombre: string; apellido: string };
  /** Si es false, solo se muestra la documentación cargada (sin el alta). */
  puedeCargar?: boolean;
}

/**
 * US-24 — Documentación obligatoria de un participante: lo cargado y el alta
 * de un documento nuevo. Vive dentro del participante (DT-11): la exigida por
 * disciplina/categoría se configura en Disciplinas (US-44/48).
 */
export function DocumentacionParticipante({ persona, puedeCargar = true }: DocumentacionParticipanteProps) {
  const crear = useCrearDocumentacion();
  const { data: documentos, isLoading } = useDocumentacionPorPersona(persona.id);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentacionFormValues>({
    resolver: zodResolver(documentacionSchema),
    defaultValues: { tipo: '', fechaVencimiento: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await crear.mutateAsync({ payload: { ...values, personaId: persona.id }, archivo });
      toast.success('Documentación cargada correctamente');
      reset({ tipo: '', fechaVencimiento: '' });
      setArchivo(null);
      setFileKey((k) => k + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la documentación');
    }
  });

  return (
    <div className="space-y-6">
      <section aria-labelledby={`doc-cargada-${persona.id}`}>
        <h3 id={`doc-cargada-${persona.id}`} className="mb-3 text-sm font-semibold text-slate-800">
          Documentación cargada
        </h3>
        {isLoading ? (
          <Spinner className="h-5 w-5" />
        ) : documentos && documentos.length > 0 ? (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {documentos.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
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
        ) : (
          <p className="text-sm text-slate-500">Todavía no hay documentación cargada.</p>
        )}
      </section>

      {puedeCargar && (
        <section aria-labelledby={`doc-nueva-${persona.id}`} className="border-t border-slate-200 pt-5">
          <h3 id={`doc-nueva-${persona.id}`} className="mb-3 text-sm font-semibold text-slate-800">
            Nuevo documento
          </h3>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <Input
              id={`tipo-${persona.id}`}
              label="Tipo de documento"
              placeholder="Ej: Apto físico"
              error={errors.tipo?.message}
              {...register('tipo')}
            />
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
    </div>
  );
}
