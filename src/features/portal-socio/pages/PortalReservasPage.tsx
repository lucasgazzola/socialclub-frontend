import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, CalendarX2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, Spinner } from '@/components/ui';
import { irAPagar } from '@/features/pasarela/hooks/usePasarela';
import {
  useCancelarMiReserva,
  useMisReservas,
  usePagarSena,
} from '@/features/reservas/hooks/useReservas';
import { formatearPesos, type MiReserva } from '@/features/reservas/types';
import { ROUTES } from '@/routes/paths';
import {
  PortalButton,
  PortalEmptyState,
  PortalPageHeader,
  PortalPanel,
  PortalStatusPill,
} from '../components/PortalUI';

const errorDe = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo completar la acción.');

const ESTADO_RESERVA_TONE: Record<
  MiReserva['estado'],
  { label: string; tone: 'active' | 'pending' | 'danger' | 'info' | 'neutral' }
> = {
  PENDIENTE_APROBACION: { label: 'Pendiente', tone: 'pending' },
  APROBADA_PENDIENTE_PAGO: { label: 'Seña pendiente', tone: 'info' },
  CONFIRMADA: { label: 'Confirmada', tone: 'active' },
  RECHAZADA: { label: 'Rechazada', tone: 'danger' },
  CANCELADA_USUARIO: { label: 'Cancelada', tone: 'neutral' },
  CANCELADA_FALTA_PAGO: { label: 'Vencida', tone: 'danger' },
  CANCELADA_INSTITUCION: { label: 'Cancelada por el club', tone: 'neutral' },
};

export function PortalReservasPage() {
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
      <PortalPageHeader
        title="Mis reservas"
        subtitle="Seguí el estado de tus solicitudes de alquiler de espacios y aboná señas aprobadas."
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-7 w-7 text-zinc-400" />
        </div>
      ) : isError ? (
        <PortalPanel className="border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
          {errorDe(error)}
        </PortalPanel>
      ) : !reservas?.length ? (
        <PortalEmptyState
          testId="sin-reservas"
          icon={<CalendarX2 size={22} />}
          title="Todavía no hiciste ninguna solicitud de reserva"
          description="Cuando solicites el uso de un espacio del club, vas a poder hacer seguimiento y pagar tu seña desde acá."
        />
      ) : (
        <div className="space-y-5">
          {conSenaPendiente.map((r) => (
            <PortalPanel
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 border-amber-400/25 bg-amber-400/[0.06] p-5"
            >
              <div className="flex items-start gap-3.5" data-testid={`sena-pendiente-${r.codigo}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/15 text-amber-300">
                  <AlarmClock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-200 tabular-nums">
                    Pagá la seña de {formatearPesos(r.montoSena)} antes del {r.limitePagoSenaTexto}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-200/80">
                    Reserva {r.codigo} · {r.espacio.nombre} · {r.turno}
                  </p>
                  {r.instruccionesSena && (
                    <p className="mt-1 text-xs text-amber-200/70">{r.instruccionesSena}</p>
                  )}
                </div>
              </div>
              {r.puedePagarSena && (
                <PortalButton
                  variant="primary"
                  size="sm"
                  onClick={() => void pagar(r)}
                  disabled={pagarSena.isPending}
                >
                  <CreditCard size={14} />
                  Pagar seña online
                </PortalButton>
              )}
            </PortalPanel>
          ))}

          <PortalPanel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-5 py-3.5">Código</th>
                    <th className="px-5 py-3.5">Espacio</th>
                    <th className="px-5 py-3.5">Turno</th>
                    <th className="px-5 py-3.5 text-right">Monto</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {reservas.map((r) => {
                    const meta = ESTADO_RESERVA_TONE[r.estado] ?? {
                      label: r.estado,
                      tone: 'neutral' as const,
                    };
                    return (
                      <tr
                        key={r.id}
                        data-testid={`mi-reserva-${r.codigo}`}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-400 tabular-nums">
                          {r.codigo}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-white">{r.espacio.nombre}</td>
                        <td className="px-5 py-3.5 text-zinc-300 tabular-nums">{r.turno}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-white tabular-nums">
                          {formatearPesos(r.montoTotal)}
                        </td>
                        <td className="px-5 py-3.5">
                          <PortalStatusPill tone={meta.tone} dot>
                            {meta.label}
                          </PortalStatusPill>
                          {r.motivoRechazo && (
                            <p className="mt-1 text-xs text-rose-400">Motivo: {r.motivoRechazo}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {r.puedePagarSena && (
                              <PortalButton
                                variant="primary"
                                size="sm"
                                onClick={() => void pagar(r)}
                                disabled={pagarSena.isPending}
                              >
                                Pagar seña
                              </PortalButton>
                            )}
                            {r.puedeCancelar && (
                              <PortalButton
                                variant="danger"
                                size="sm"
                                onClick={() => setACancelar(r)}
                              >
                                Cancelar
                              </PortalButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PortalPanel>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(aCancelar)}
        variant="danger"
        title="Cancelar reserva"
        description={
          aCancelar
            ? `¿Confirmás la cancelación de la reserva ${aCancelar.codigo} (${aCancelar.espacio.nombre} — ${aCancelar.turno})?`
            : ''
        }
        confirmLabel="Sí, cancelar reserva"
        onConfirm={() => void confirmarCancelacion()}
        onCancel={() => setACancelar(null)}
        loading={cancelar.isPending}
      />
    </div>
  );
}
