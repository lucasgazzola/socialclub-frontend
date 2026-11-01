import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, CalendarX2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Spinner } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import { useCancelarMiReserva, useMisReservas, usePagarSena } from '../hooks/useReservas';
import { EstadoReservaBadge } from '../components/EstadoReservaBadge';
import { formatearPesos, type MiReserva } from '../types';

const errorDe = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo completar la acción.');

/**
 * US-62 — «Mis Reservas»: historial de solicitudes del usuario con su estado.
 * Desde acá se paga la seña online (US-60) y se cancela antes del plazo de
 * penalización (US-61).
 */
export function MisReservasPage() {
  const navigate = useNavigate();
  const { data: reservas, isLoading, isError, error } = useMisReservas();
  const cancelar = useCancelarMiReserva();
  const pagarSena = usePagarSena();
  const [aCancelar, setACancelar] = useState<MiReserva | null>(null);

  const pagar = async (reserva: MiReserva) => {
    try {
      const orden = await pagarSena.mutateAsync(reserva.id);
      if (orden.urlPago) irAPagar(orden.urlPago);
      else navigate(`${ROUTES.resultadoPago}?referencia=${encodeURIComponent(orden.referencia)}`);
    } catch (e) {
      toast.error(errorDe(e));
    }
  };

  const confirmarCancelacion = async () => {
    if (!aCancelar) return;
    try {
      toast.success((await cancelar.mutateAsync(aCancelar.id)).mensaje);
      setACancelar(null);
    } catch (e) {
      toast.error(errorDe(e));
    }
  };

  const conSenaPendiente = reservas?.filter((r) => r.estado === 'APROBADA_PENDIENTE_PAGO') ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis reservas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Seguí el estado de tus solicitudes de alquiler de espacios.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorDe(error)}</div>
      ) : !reservas?.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm" data-testid="sin-reservas">
          <CalendarX2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">Todavía no hiciste ninguna solicitud de reserva.</p>
          <p className="mt-1 text-sm text-slate-500">Cuando pidas un espacio, vas a ver acá su estado.</p>
        </div>
      ) : (
        <>
          {conSenaPendiente.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              data-testid={`sena-pendiente-${r.codigo}`}
            >
              <div className="flex gap-3">
                <AlarmClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">
                    Pagá la seña de {formatearPesos(r.montoSena)} antes del {r.limitePagoSenaTexto}
                  </p>
                  <p className="text-sm text-amber-800">
                    Reserva {r.codigo} · {r.espacio.nombre} · {r.turno}
                  </p>
                  {r.instruccionesSena && <p className="mt-1 text-xs text-amber-800">{r.instruccionesSena}</p>}
                </div>
              </div>
              {r.puedePagarSena && (
                <Button onClick={() => void pagar(r)} disabled={pagarSena.isPending}>
                  <CreditCard size={16} /> Pagar seña con Mercado Pago
                </Button>
              )}
            </div>
          ))}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Espacio</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3 text-right">Monto total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservas.map((r) => (
                  <tr key={r.id} className="align-top transition-colors hover:bg-slate-50" data-testid={`mi-reserva-${r.codigo}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{r.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.espacio.nombre}</td>
                    <td className="px-4 py-3">{r.turno}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-slate-900">{formatearPesos(r.montoTotal)}</div>
                      <div className="text-xs text-slate-500">Seña {formatearPesos(r.montoSena)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoReservaBadge estado={r.estado} />
                      {(r.motivoRechazo || r.motivoCancelacion) && (
                        <div className="mt-1 max-w-64 text-xs text-slate-500">
                          Motivo: {r.motivoRechazo ?? r.motivoCancelacion}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.puedeCancelar ? (
                        <Button size="sm" variant="outline" onClick={() => setACancelar(r)}>
                          Cancelar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!aCancelar}
        variant="danger"
        title="Cancelar reserva"
        description={
          aCancelar
            ? `Vas a cancelar la reserva ${aCancelar.codigo} (${aCancelar.espacio.nombre}, ${aCancelar.turno}). El turno queda libre para otras personas.${aCancelar.estado === 'CONFIRMADA' ? ' Consultá en la secretaría por la devolución de la seña.' : ''}`
            : undefined
        }
        confirmLabel="Cancelar reserva"
        cancelLabel="Volver"
        loading={cancelar.isPending}
        onConfirm={() => void confirmarCancelacion()}
        onCancel={() => setACancelar(null)}
      />
    </div>
  );
}
