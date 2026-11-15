import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, CalendarClock, CalendarX2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
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
  PortalConfirmModal,
  PortalEmptyState,
  PortalSpinner,
  PortalSurface,
  PortalTag,
  PortalTitleBar,
} from '../components/PortalUI';

const errorDe = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo completar la acciÃ³n.');

const ESTADO_RESERVA_TONE: Record<
  MiReserva['estado'],
  { label: string; tone: 'active' | 'pending' | 'danger' | 'info' | 'neutral' }
> = {
  PENDIENTE_APROBACION: { label: 'Pendiente', tone: 'pending' },
  APROBADA_PENDIENTE_PAGO: { label: 'SeÃ±a pendiente', tone: 'info' },
  CONFIRMADA: { label: 'Confirmada', tone: 'active' },
  RECHAZADA: { label: 'Rechazada', tone: 'danger' },
  CANCELADA_USUARIO: { label: 'Cancelada', tone: 'neutral' },
  CANCELADA_FALTA_PAGO: { label: 'Vencida', tone: 'danger' },
  CANCELADA_INSTITUCION: { label: 'Cancelada por el club', tone: 'neutral' },
};

/**
 * Reservas del socio/participante como feed cronolÃ³gico de tickets (cero tabla administrativa).
 */
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
      <PortalTitleBar
        title="Mis reservas"
        summary="SeguÃ­ el estado de tus solicitudes de espacios del club y abonÃ¡ seÃ±as pendientes."
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <PortalSpinner />
        </div>
      ) : isError ? (
        <PortalSurface className="border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {errorDe(error)}
        </PortalSurface>
      ) : !reservas?.length ? (
        <PortalEmptyState
          testId="sin-reservas"
          icon={<CalendarX2 size={20} />}
          title="TodavÃ­a no hiciste ninguna solicitud de reserva"
          description="Cuando solicites un espacio del club, podrÃ¡s hacer el seguimiento y pagar tu seÃ±a aquÃ­."
        />
      ) : (
        <div className="space-y-5">
          {conSenaPendiente.map((r) => (
            <PortalSurface
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-4 border-blue-400/35 bg-blue-500/[0.08] p-4 sm:p-5"
            >
              <div className="flex items-start gap-3" data-testid={`sena-pendiente-${r.codigo}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-blue-400/30 bg-blue-500/15 text-blue-300">
                  <AlarmClock size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-200 tabular-nums">
                    PagÃ¡ la seÃ±a de {formatearPesos(r.montoSena)} antes del {r.limitePagoSenaTexto}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Reserva <span className="font-mono">{r.codigo}</span> Â· {r.espacio.nombre} Â·{' '}
                    {r.turno}
                  </p>
                  {r.instruccionesSena && (
                    <p className="mt-1 text-xs text-slate-400">{r.instruccionesSena}</p>
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
                  Pagar seÃ±a online
                </PortalButton>
              )}
            </PortalSurface>
          ))}

          {/* Lista de tickets de reserva (no tabla CRUD) */}
          <div className="space-y-3">
            {reservas.map((r) => {
              const meta = ESTADO_RESERVA_TONE[r.estado] ?? {
                label: r.estado,
                tone: 'neutral' as const,
              };
              return (
                <PortalSurface
                  key={r.id}
                  className="p-4 transition-colors hover:border-blue-400/30 sm:p-5"
                >
                  <div
                    data-testid={`mi-reserva-${r.codigo}`}
                    className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-blue-400/20 bg-blue-500/10 text-blue-400">
                        <CalendarClock size={18} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold tracking-[-0.015em] text-white">
                            {r.espacio.nombre}
                          </h2>
                          <span className="rounded-[2px] border border-slate-300/[0.12] bg-[#070b14] px-1.5 py-0.5 font-mono text-[11px] text-slate-300 tabular-nums">
                            {r.codigo}
                          </span>
                          <PortalTag tone={meta.tone} dot>
                            {meta.label}
                          </PortalTag>
                        </div>

                        <p className="text-xs text-slate-300 tabular-nums">{r.turno}</p>

                        {r.motivoRechazo && (
                          <p className="text-xs font-medium text-rose-400">
                            Motivo: {r.motivoRechazo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-300/[0.08] pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          Monto total
                        </p>
                        <p className="text-base font-semibold text-white tabular-nums">
                          {formatearPesos(r.montoTotal)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.puedePagarSena && (
                          <PortalButton
                            variant="primary"
                            size="sm"
                            onClick={() => void pagar(r)}
                            disabled={pagarSena.isPending}
                          >
                            Pagar seÃ±a
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
                    </div>
                  </div>
                </PortalSurface>
              );
            })}
          </div>
        </div>
      )}

      <PortalConfirmModal
        open={Boolean(aCancelar)}
        danger
        title="Cancelar reserva"
        description={
          aCancelar
            ? `Â¿ConfirmÃ¡s la cancelaciÃ³n de la reserva ${aCancelar.codigo} (${aCancelar.espacio.nombre} â€” ${aCancelar.turno})?`
            : ''
        }
        confirmLabel="SÃ­, cancelar reserva"
        onConfirm={() => void confirmarCancelacion()}
        onCancel={() => setACancelar(null)}
        loading={cancelar.isPending}
      />
    </div>
  );
}
