import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, DateInput } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useBuscarParticipante } from '@/features/inscripcion/hooks/useBuscarParticipante';
import { BuscarParticipanteDni } from '@/features/inscripcion/components/buscarParticipanteDni';
import { useHistorialDeportivo } from '../hooks/useHistorialDeportivo';
import type { HistorialDeportivoResponse } from '../types';

function EstadoDeudaBadge({ estado }: { estado: 'AL_DIA' | 'MOROSO' }) {
  const alDia = estado === 'AL_DIA';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        alDia ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {alDia ? 'Al día' : 'Con deuda'}
    </span>
  );
}

function formatMonto(monto: number): string {
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistorialDeportivo({ data }: { data: HistorialDeportivoResponse }) {
  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between p-5">
        <div>
          <p className="text-lg font-semibold text-slate-900">{data.participanteNombre}</p>
          <p className="text-sm text-slate-500">
            DNI {data.dni ?? '—'} · Categoría {data.categoria ?? 'sin categoría'}
          </p>
        </div>
        <div className="text-right">
          <EstadoDeudaBadge estado={data.estadoDeuda} />
          <p className="mt-2 text-xs text-slate-500">
            Pagado {formatMonto(data.totalPagado)} · Adeudado{' '}
            <span className="font-semibold text-slate-700">{formatMonto(data.totalAdeudado)}</span>
          </p>
        </div>
      </Card>

      {/* Pagos realizados */}
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Pagos realizados</h3>
        {data.pagos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay pagos registrados para el filtro seleccionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Disciplina</th>
                  <th className="py-2 pr-4">Período</th>
                  <th className="py-2 pr-4">Fecha de pago</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2">Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {data.pagos.map((pago) => (
                  <tr key={pago.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{pago.disciplinaNombre}</td>
                    <td className="py-2 pr-4">{pago.periodo}</td>
                    <td className="py-2 pr-4">{formatFecha(pago.fechaPago)}</td>
                    <td className="py-2 pr-4 font-medium text-slate-900">{formatMonto(pago.monto)}</td>
                    <td className="py-2 text-slate-600">{pago.registradoPor?.nombre ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Períodos adeudados */}
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Períodos adeudados</h3>
        {data.adeudados.length === 0 ? (
          <p className="text-sm text-slate-600">El participante está al día con sus cuotas deportivas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Disciplina</th>
                  <th className="py-2 pr-4">Período</th>
                  <th className="py-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.adeudados.map((cuota) => (
                  <tr key={`${cuota.disciplinaId}-${cuota.periodo}`} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{cuota.disciplinaNombre}</td>
                    <td className="py-2 pr-4">{cuota.periodo}</td>
                    <td className="py-2 font-medium text-amber-700">{formatMonto(cuota.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * US-22 — El administrador consulta el historial de cuotas deportivas de un
 * jugador: pagos realizados (período, fecha, monto, quién lo registró) y
 * períodos adeudados, con filtro por rango de fechas. Vista de solo lectura.
 */
export function HistorialDeportivoPage() {
  const navigate = useNavigate();
  const busqueda = useBuscarParticipante();
  const participante = busqueda.participante;
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const filtro = useMemo(
    () => ({ desde: desde || undefined, hasta: hasta || undefined }),
    [desde, hasta],
  );
  const { data, isLoading } = useHistorialDeportivo(participante?.id ?? null, filtro);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Historial de cuotas deportivas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Buscá al jugador por DNI y consultá sus pagos y períodos adeudados. Solo lectura.
        </p>
      </header>

      <BuscarParticipanteDni
        onBuscar={busqueda.buscar}
        cargando={busqueda.cargando}
        noEncontrado={busqueda.noEncontrado}
        error={busqueda.error}
        onRegistrarNuevo={() => navigate(ROUTES.inscripcion)}
      />

      {participante && (
        <Card className="flex flex-wrap items-end gap-4 p-5">
          <DateInput label="Desde" value={desde} max={hasta || undefined} onChange={setDesde} containerClassName="w-44" />
          <DateInput label="Hasta" value={hasta} min={desde || undefined} onChange={setHasta} containerClassName="w-44" />
          {(desde || hasta) && (
            <button
              type="button"
              className="text-sm font-medium text-brand-700 hover:underline"
              onClick={() => {
                setDesde('');
                setHasta('');
              }}
            >
              Limpiar filtro
            </button>
          )}
        </Card>
      )}

      {participante && isLoading && (
        <p className="text-sm text-slate-500">Cargando historial…</p>
      )}
      {participante && data && <HistorialDeportivo data={data} />}
    </div>
  );
}
