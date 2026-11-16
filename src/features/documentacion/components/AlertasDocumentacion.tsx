import { useState } from 'react';
import { BellRing, FileText } from 'lucide-react';
import { Badge, Modal, Spinner, type BadgeVariant } from '@/components/ui';
import { isoADisplay } from '@/lib/utils/fecha';
import { useAlertasDocumentacion } from '../hooks/useDocumentacion';
import type { AlertaDocumentacion, TipoAlertaDocumentacion } from '../types';
import { DocumentacionParticipante } from './DocumentacionParticipante';

const ESTADO: Record<TipoAlertaDocumentacion, { texto: string; variante: BadgeVariant }> = {
  POR_VENCER: { texto: 'Por vencer', variante: 'warning' },
  VENCIDO: { texto: 'Vencido', variante: 'danger' },
  PRESENTACION_POR_VENCER: { texto: 'Falta presentar', variante: 'warning' },
  PRESENTACION_VENCIDA: { texto: 'Plazo vencido', variante: 'danger' },
};

function cuando(alerta: AlertaDocumentacion): string {
  const d = alerta.diasRestantes;
  if (d < 0) return d === -1 ? 'hace 1 día' : `hace ${-d} días`;
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  return `en ${d} días`;
}

/** "Apellido, Nombre" → persona para el modal de documentación. */
function personaDe(alerta: AlertaDocumentacion) {
  const [apellido, ...resto] = alerta.participante.split(', ');
  return { id: alerta.personaId, apellido, nombre: resto.join(', ') };
}

/**
 * US-26 — Alertas de documentación en el Inicio: lo que vence o termina su
 * plazo de presentación en los próximos 10 días, y lo ya vencido. Cada fila
 * abre la documentación del participante para resolverlo ahí mismo.
 */
export function AlertasDocumentacion() {
  const { data: alertas = [], isLoading, isError } = useAlertasDocumentacion();
  const [abierta, setAbierta] = useState<AlertaDocumentacion | null>(null);

  return (
    <section aria-labelledby="alertas-documentacion" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2
          id="alertas-documentacion"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          <BellRing className="size-3.5 text-accent-500" />
          Alertas de documentación
        </h2>
        {alertas.length > 0 && (
          <span className="text-xs text-slate-400">
            {alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'} · próximos 10 días
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar las alertas de documentación.
        </div>
      ) : alertas.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No hay documentación por vencer ni pendiente en los próximos 10 días.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3.5">Participante</th>
                  <th className="px-5 py-3.5">Disciplina</th>
                  <th className="px-5 py-3.5">Documento</th>
                  <th className="whitespace-nowrap px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertas.map((alerta) => {
                  const { texto, variante } = ESTADO[alerta.tipo];
                  return (
                    <tr key={alerta.clave} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                        {alerta.participante}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {alerta.disciplina}
                        {alerta.categoria && (
                          <span className="text-slate-400"> · {alerta.categoria}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{alerta.documento}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="text-slate-900">{isoADisplay(alerta.fecha)}</span>
                        <span className="block text-xs text-slate-500">{cuando(alerta)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variante}>{texto}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setAbierta(alerta)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                          aria-label={`Ver documentación de ${alerta.participante}`}
                        >
                          <FileText size={14} />
                          Ver documentación
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={abierta !== null}
        title={abierta ? `Documentación de ${abierta.participante}` : 'Documentación'}
        onClose={() => setAbierta(null)}
        icon={<FileText />}
        size="lg"
      >
        {abierta && <DocumentacionParticipante persona={personaDe(abierta)} />}
      </Modal>
    </section>
  );
}
