import { useState } from 'react';
import { AlertTriangle, Check, Search, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Input, Spinner, StatusTabs } from '@/components/ui';
import { formatearDni } from '@/lib/utils/dni';
import {
  useAprobarReserva,
  useCancelarPorFaltaPago,
  useCancelarPorInstitucion,
  useRechazarReserva,
  useRegistrarSena,
  useSolicitudesReserva,
} from '../hooks/useReservas';
import { EstadoReservaBadge } from '../components/EstadoReservaBadge';
import { MotivoModal } from '../components/MotivoModal';
import { RegistrarSenaModal } from '../components/RegistrarSenaModal';
import { formatearPesos, type EstadoReserva, type SolicitudReserva } from '../types';

type Pestania = 'PENDIENTES' | 'PENDIENTES_PAGO' | 'CONFIRMADAS' | 'RECHAZADAS' | 'CANCELADAS';

const ESTADOS: Record<Pestania, EstadoReserva[]> = {
  PENDIENTES: ['PENDIENTE_APROBACION'],
  PENDIENTES_PAGO: ['APROBADA_PENDIENTE_PAGO'],
  CONFIRMADAS: ['CONFIRMADA'],
  RECHAZADAS: ['RECHAZADA'],
  CANCELADAS: ['CANCELADA_USUARIO', 'CANCELADA_FALTA_PAGO', 'CANCELADA_INSTITUCION'],
};

type Accion =
  | { tipo: 'aprobar' | 'falta-pago'; reserva: SolicitudReserva }
  | { tipo: 'rechazar' | 'cancelar'; reserva: SolicitudReserva }
  | { tipo: 'sena'; reserva: SolicitudReserva };

const errorDe = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo completar la acción.');

/**
 * US-60 · US-61 — Bandeja de solicitudes de reserva para la administración:
 * aprobar o rechazar, registrar la seña y cancelar (por el club o por falta
 * de pago).
 */
export function SolicitudesReservaPage() {
  const [pestania, setPestania] = useState<Pestania>('PENDIENTES');
  const [busqueda, setBusqueda] = useState('');
  const [accion, setAccion] = useState<Accion | null>(null);
  const { data: reservas, isLoading, isError, error } = useSolicitudesReserva(
    ESTADOS[pestania],
    busqueda.trim(),
  );

  const aprobar = useAprobarReserva();
  const rechazar = useRechazarReserva();
  const registrarSena = useRegistrarSena();
  const cancelar = useCancelarPorInstitucion();
  const faltaPago = useCancelarPorFaltaPago();

  const ejecutar = async (fn: () => Promise<{ mensaje: string }>) => {
    try {
      toast.success((await fn()).mensaje);
      setAccion(null);
    } catch (e) {
      toast.error(errorDe(e));
    }
  };

  const vencida = (r: SolicitudReserva) =>
    !!r.limitePagoSena && new Date(r.limitePagoSena) < new Date();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Solicitudes de reserva</h1>
          <p className="mt-1 text-sm text-slate-500">
            Evaluá las solicitudes de alquiler de espacios, registrá las señas y gestioná las
            cancelaciones.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusTabs<Pestania>
          value={pestania}
          onChange={setPestania}
          aria-label="Estado de las reservas"
          tabs={[
            { value: 'PENDIENTES', label: 'Pendientes' },
            { value: 'PENDIENTES_PAGO', label: 'Pendientes de pago' },
            { value: 'CONFIRMADAS', label: 'Confirmadas' },
            { value: 'RECHAZADAS', label: 'Rechazadas' },
            { value: 'CANCELADAS', label: 'Canceladas' },
          ]}
        />
        <div className="w-full sm:w-72">
          <Input
            id="buscar-reservas"
            placeholder="Buscar por nombre, DNI o código…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-700">{errorDe(error)}</p>
        ) : !reservas?.length ? (
          <p className="p-8 text-center text-sm text-slate-500">No hay reservas en este estado.</p>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Espacio y turno</th>
                <th className="px-4 py-3 text-right">Total / Seña</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservas.map((r) => (
                <tr key={r.id} className="align-top transition-colors hover:bg-slate-50" data-testid={`reserva-${r.codigo}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">{r.codigo}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.solicitante.nombre}</div>
                    <div className="text-xs text-slate-500">
                      {r.solicitante.dni ? `DNI ${formatearDni(r.solicitante.dni)}` : r.solicitante.email}
                      {r.solicitante.telefono ? ` · Tel. ${r.solicitante.telefono}` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      <span
                        className={`rounded px-1.5 py-0.5 font-medium ${r.solicitante.esSocio ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {r.solicitante.esSocio ? 'Socio' : 'No socio'}
                      </span>
                      {r.solicitante.esSocio && (
                        <span
                          className={`rounded px-1.5 py-0.5 font-medium ${r.solicitante.deuda > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
                        >
                          {r.solicitante.deuda > 0
                            ? `Debe ${r.solicitante.cuotasAdeudadas} cuota(s) · ${formatearPesos(r.solicitante.deuda)}`
                            : 'Al día'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.espacio.nombre}</div>
                    <div className="whitespace-nowrap text-xs text-slate-500">{r.turno}</div>
                    {r.conflictos.length > 0 && (
                      <div className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Turno ocupado: {r.conflictos.map((c) => `${c.detalle} (${c.desde.slice(-5)}–${c.hasta.slice(-5)})`).join(', ')}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-slate-900">{formatearPesos(r.montoTotal)}</div>
                    <div className="text-xs text-slate-500">Seña {formatearPesos(r.montoSena)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoReservaBadge estado={r.estado} />
                    {r.estado === 'APROBADA_PENDIENTE_PAGO' && r.limitePagoSenaTexto && (
                      <div className={`mt-1 text-xs ${vencida(r) ? 'font-semibold text-rose-700' : 'text-slate-500'}`}>
                        {vencida(r) ? 'Seña vencida el' : 'Seña hasta el'} {r.limitePagoSenaTexto}
                      </div>
                    )}
                    {(r.motivoRechazo || r.motivoCancelacion) && (
                      <div className="mt-1 max-w-56 text-xs text-slate-500">
                        Motivo: {r.motivoRechazo ?? r.motivoCancelacion}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.estado === 'PENDIENTE_APROBACION' && (
                        <>
                          <Button size="sm" variant="success" onClick={() => setAccion({ tipo: 'aprobar', reserva: r })}>
                            <Check size={14} /> Aprobar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAccion({ tipo: 'rechazar', reserva: r })}>
                            <X size={14} /> Rechazar
                          </Button>
                        </>
                      )}
                      {r.estado === 'APROBADA_PENDIENTE_PAGO' && (
                        <Button size="sm" variant="success" onClick={() => setAccion({ tipo: 'sena', reserva: r })}>
                          <Wallet size={14} /> Registrar seña
                        </Button>
                      )}
                      {r.estado === 'APROBADA_PENDIENTE_PAGO' && vencida(r) && (
                        <Button size="sm" variant="outline" onClick={() => setAccion({ tipo: 'falta-pago', reserva: r })}>
                          Cancelar por falta de pago
                        </Button>
                      )}
                      {(r.estado === 'APROBADA_PENDIENTE_PAGO' || r.estado === 'CONFIRMADA') && (
                        <Button size="sm" variant="outline" onClick={() => setAccion({ tipo: 'cancelar', reserva: r })}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={accion?.tipo === 'aprobar'}
        variant="success"
        title="Aprobar solicitud"
        description={
          accion
            ? `Se bloquea el turno de ${accion.reserva.espacio.nombre} (${accion.reserva.turno}) y ${accion.reserva.solicitante.nombre} tendrá un plazo para pagar la seña de ${formatearPesos(accion.reserva.montoSena)}.`
            : undefined
        }
        confirmLabel="Aprobar"
        loading={aprobar.isPending}
        onConfirm={() => accion && void ejecutar(() => aprobar.mutateAsync(accion.reserva.id))}
        onCancel={() => setAccion(null)}
      />
      <ConfirmDialog
        open={accion?.tipo === 'falta-pago'}
        variant="danger"
        title="Cancelar por falta de pago"
        description={
          accion
            ? `Venció el plazo para pagar la seña de la reserva ${accion.reserva.codigo}. Se cancela, se libera el turno y se avisa al solicitante.`
            : undefined
        }
        confirmLabel="Cancelar reserva"
        loading={faltaPago.isPending}
        onConfirm={() => accion && void ejecutar(() => faltaPago.mutateAsync(accion.reserva.id))}
        onCancel={() => setAccion(null)}
      />
      <MotivoModal
        open={accion?.tipo === 'rechazar'}
        titulo="Rechazar solicitud"
        descripcion={accion ? `Reserva ${accion.reserva.codigo} de ${accion.reserva.solicitante.nombre}.` : ''}
        etiquetaConfirmar="Rechazar solicitud"
        isLoading={rechazar.isPending}
        onConfirmar={(motivo) =>
          accion && void ejecutar(() => rechazar.mutateAsync({ id: accion.reserva.id, motivo }))
        }
        onClose={() => setAccion(null)}
      />
      <MotivoModal
        open={accion?.tipo === 'cancelar'}
        titulo="Cancelar reserva por el club"
        descripcion={
          accion
            ? `Reserva ${accion.reserva.codigo} (${accion.reserva.turno}). El turno se libera.${accion.reserva.estado === 'CONFIRMADA' ? ' La seña ya está pagada: corresponde devolverla.' : ''}`
            : ''
        }
        etiquetaConfirmar="Cancelar reserva"
        isLoading={cancelar.isPending}
        onConfirmar={(motivo) =>
          accion && void ejecutar(() => cancelar.mutateAsync({ id: accion.reserva.id, motivo }))
        }
        onClose={() => setAccion(null)}
      />
      <RegistrarSenaModal
        reserva={accion?.tipo === 'sena' ? accion.reserva : null}
        isLoading={registrarSena.isPending}
        onConfirmar={(metodoPago) =>
          accion && void ejecutar(() => registrarSena.mutateAsync({ id: accion.reserva.id, metodoPago }))
        }
        onClose={() => setAccion(null)}
      />
    </div>
  );
}
