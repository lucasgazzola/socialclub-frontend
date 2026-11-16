import { useState } from 'react';
import { Check, ExternalLink, FileSearch, X } from 'lucide-react';
import { Button, Modal, ModalActions, Spinner } from '@/components/ui';
import { env } from '@/config/env';
import { etiquetaTipoDocumento } from '@/features/disciplinas/types';
import { isoADisplay } from '@/lib/utils/fecha';
import { usePendientesRevision, useRevisarDocumento } from '../hooks/useDocumentacion';
import type { DocumentoPendienteRevision } from '../types';

/** El nombre del catálogo. `tipo` es una descripción libre y en el padrón quedó el enum. */
function nombreDocumento(doc: DocumentoPendienteRevision): string {
  return doc.tipoDocumento ? etiquetaTipoDocumento(doc.tipoDocumento) : doc.tipo;
}

/**
 * TASK-60 — Documentos que los socios y participantes subieron desde Mi club y
 * esperan revisión. El delegado ve los de sus disciplinas; el admin, todos.
 * Hasta que se aprueban no cuentan para la habilitación.
 */
export function DocumentosParaRevisar() {
  const { data: pendientes = [], isLoading, isError } = usePendientesRevision();
  const revisar = useRevisarDocumento();
  const [rechazando, setRechazando] = useState<DocumentoPendienteRevision | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);

  if (!isLoading && !isError && pendientes.length === 0) return null;

  const confirmarRechazo = async () => {
    if (!rechazando) return;
    if (motivo.trim().length < 5) {
      setErrorMotivo('Contale al titular qué corregir (al menos 5 caracteres).');
      return;
    }
    await revisar.mutateAsync({ id: rechazando.id, aprobar: false, motivo: motivo.trim() });
    setRechazando(null);
    setMotivo('');
    setErrorMotivo(null);
  };

  return (
    <section aria-labelledby="documentos-para-revisar" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="documentos-para-revisar"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          <FileSearch className="size-3.5 text-brand-600" />
          Documentación para revisar
        </h2>
        {pendientes.length > 0 && (
          <span className="text-xs text-slate-400">
            {pendientes.length === 1 ? '1 documento subido' : `${pendientes.length} documentos subidos`} desde Mi club
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar la documentación para revisar.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3.5">Participante</th>
                  <th className="px-5 py-3.5">Disciplinas</th>
                  <th className="px-5 py-3.5">Documento</th>
                  <th className="whitespace-nowrap px-5 py-3.5">Vence</th>
                  <th className="whitespace-nowrap px-5 py-3.5">Enviado</th>
                  <th className="px-5 py-3.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendientes.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                      {doc.persona.apellido}, {doc.persona.nombre}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {doc.persona.inscripciones.map((i) => i.disciplina.nombre).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {nombreDocumento(doc)}
                      {doc.archivoNombre && (
                        <a
                          href={`${env.apiUrl}/documentacion/${doc.id}/archivo`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Ver archivo <ExternalLink size={11} aria-hidden />
                        </a>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {doc.fechaVencimiento ? isoADisplay(doc.fechaVencimiento) : 'Sin vencimiento'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{isoADisplay(doc.creadoEn)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={revisar.isPending}
                          onClick={() => revisar.mutate({ id: doc.id, aprobar: true })}
                          aria-label={`Aprobar ${nombreDocumento(doc)} de ${doc.persona.nombre} ${doc.persona.apellido}`}
                        >
                          <Check size={14} /> Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={revisar.isPending}
                          onClick={() => setRechazando(doc)}
                          aria-label={`Rechazar ${nombreDocumento(doc)} de ${doc.persona.nombre} ${doc.persona.apellido}`}
                        >
                          <X size={14} /> Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(rechazando)}
        onClose={() => {
          setRechazando(null);
          setErrorMotivo(null);
        }}
        title="Rechazar documento"
        description={
          rechazando
            ? `${nombreDocumento(rechazando)} de ${rechazando.persona.nombre} ${rechazando.persona.apellido}. Le vamos a avisar por email con el motivo para que lo vuelva a subir.`
            : undefined
        }
        icon={<X size={16} />}
        size="md"
      >
        <label htmlFor="motivo-rechazo" className="mb-1.5 block text-sm font-medium text-slate-700">
          Motivo
        </label>
        <textarea
          id="motivo-rechazo"
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej.: la foto está borrosa y no se lee la fecha de vencimiento."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
        {errorMotivo && <p className="mt-1 text-xs text-red-600">{errorMotivo}</p>}
        <ModalActions>
          <Button variant="secondary" onClick={() => setRechazando(null)}>
            Cancelar
          </Button>
          <Button variant="danger" disabled={revisar.isPending} onClick={() => void confirmarRechazo()}>
            Rechazar documento
          </Button>
        </ModalActions>
      </Modal>
    </section>
  );
}
