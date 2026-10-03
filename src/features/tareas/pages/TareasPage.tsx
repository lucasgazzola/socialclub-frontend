import { useState } from 'react';
import { History, Play, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Modal, Spinner } from '@/components/ui';
import { useEjecuciones, useEjecutarTarea, useTareas } from '../hooks/useTareas';
import { EstadoEjecucionBadge, ResultadoEjecucion } from '../components/EjecucionDetalle';
import { fechaHora, origenDe } from '../formato';
import type { TareaAutomatica } from '../types';

/**
 * DT-22 — Tareas automáticas (solo ADMIN): qué corre solo, cuándo corrió por
 * última vez y con qué resultado. Se pueden ejecutar a mano (queda auditado).
 */
export function TareasPage() {
  const { data: tareas = [], isLoading, isError } = useTareas();
  const ejecutar = useEjecutarTarea();
  const [aEjecutar, setAEjecutar] = useState<TareaAutomatica | null>(null);
  const [conHistorial, setConHistorial] = useState<TareaAutomatica | null>(null);

  const confirmarEjecucion = async () => {
    if (!aEjecutar) return;
    try {
      const ejecucion = await ejecutar.mutateAsync(aEjecutar.nombre);
      if (ejecucion.estado === 'EXITOSA') toast.success(`«${aEjecutar.nombre}» se ejecutó correctamente`);
      else if (ejecucion.estado === 'OMITIDA') toast.info('La tarea ya se estaba ejecutando');
      else toast.error(`«${aEjecutar.nombre}» falló: ${ejecucion.error ?? 'error desconocido'}`);
      setAEjecutar(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo ejecutar la tarea');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tareas automáticas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Procesos que el sistema ejecuta solo según su horario. Podés ejecutarlos a mano y revisar
          su historial.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar las tareas automáticas.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Tarea</th>
                  <th className="whitespace-nowrap px-5 py-3.5">Horario</th>
                  <th className="whitespace-nowrap px-5 py-3.5">Última ejecución</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Resultado</th>
                  <th className="px-5 py-3.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tareas.map((tarea) => {
                  const ultima = tarea.ultimaEjecucion;
                  return (
                    <tr key={tarea.nombre} className="align-top hover:bg-slate-50/60">
                      <td className="min-w-[19rem] max-w-md px-5 py-3.5">
                        <span className="flex items-center gap-2 whitespace-nowrap font-semibold text-slate-900">
                          <Timer size={15} className="shrink-0 text-accent-500" />
                          {tarea.nombre}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                          {tarea.descripcion}
                        </span>
                      </td>
                      <td className="w-40 px-5 py-3.5 text-slate-600">{tarea.horario}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {ultima ? (
                          <>
                            <span className="text-slate-900">{fechaHora(ultima.inicio)}</span>
                            <span className="block text-xs text-slate-500">{origenDe(ultima)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {ultima ? <EstadoEjecucionBadge estado={ultima.estado} /> : '—'}
                      </td>
                      <td className="min-w-[16rem] px-5 py-3.5 text-xs">
                        {ultima ? <ResultadoEjecucion ejecucion={ultima} /> : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConHistorial(tarea)}
                            aria-label={`Historial de ${tarea.nombre}`}
                          >
                            <History size={14} />
                            Historial
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAEjecutar(tarea)}
                            aria-label={`Ejecutar ${tarea.nombre}`}
                          >
                            <Play size={14} />
                            Ejecutar ahora
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={aEjecutar !== null}
        title="Ejecutar tarea"
        description={aEjecutar ? `Se va a ejecutar «${aEjecutar.nombre}» ahora.` : undefined}
        confirmLabel="Ejecutar"
        loading={ejecutar.isPending}
        onConfirm={() => void confirmarEjecucion()}
        onCancel={() => setAEjecutar(null)}
      >
        {aEjecutar ? (
          <p className="text-sm text-slate-600">
            {aEjecutar.descripcion} La ejecución queda registrada a tu nombre en Auditoría.
          </p>
        ) : null}
      </ConfirmDialog>

      <HistorialModal tarea={conHistorial} onClose={() => setConHistorial(null)} />
    </div>
  );
}

function HistorialModal({ tarea, onClose }: { tarea: TareaAutomatica | null; onClose: () => void }) {
  const { data: ejecuciones = [], isLoading } = useEjecuciones(tarea?.nombre ?? null);

  return (
    <Modal
      open={tarea !== null}
      title={tarea ? `Historial de ${tarea.nombre}` : 'Historial'}
      description="Últimas 20 ejecuciones."
      onClose={onClose}
      icon={<History />}
      size="lg"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : ejecuciones.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Todavía no se ejecutó.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2 pr-3">Inicio</th>
              <th className="py-2 pr-3">Origen</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ejecuciones.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap py-2.5 pr-3 text-slate-900">{fechaHora(e.inicio)}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-slate-600">{origenDe(e)}</td>
                <td className="py-2.5 pr-3">
                  <EstadoEjecucionBadge estado={e.estado} />
                </td>
                <td className="py-2.5 text-xs">
                  <ResultadoEjecucion ejecucion={e} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
