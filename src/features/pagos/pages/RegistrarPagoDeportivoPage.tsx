import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/routes/paths';
import { useBuscarParticipante } from '@/features/inscripcion/hooks/useBuscarParticipante';
import { BuscarParticipanteDni } from '@/features/inscripcion/components/buscarParticipanteDni';
import { usePendientesDeportivos, useRegistrarPagoDeportivo } from '../hooks/usePagosDeportivos';
import { METODOS_PAGO_SECRETARIA } from '../schemas/pagoSecretaria.schema';
import type {
  CuotaDeportivaPendiente,
  MetodoPagoSecretaria,
  PendientesDeportivosResponse,
} from '../types';

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

/** Tarjeta de cobro para una disciplina: selección de períodos + método. */
function DisciplinaCobroCard({
  personaId,
  disciplinaId,
  disciplinaNombre,
  cuotas,
}: {
  personaId: number;
  disciplinaId: number;
  disciplinaNombre: string;
  cuotas: CuotaDeportivaPendiente[];
}) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoSecretaria>('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');
  const registrar = useRegistrarPagoDeportivo(personaId);

  const toggle = (periodo: string) =>
    setSeleccionados((prev) =>
      prev.includes(periodo) ? prev.filter((p) => p !== periodo) : [...prev, periodo],
    );

  const total = useMemo(
    () => cuotas.filter((c) => seleccionados.includes(c.periodo)).reduce((s, c) => s + c.monto, 0),
    [cuotas, seleccionados],
  );

  const onRegistrar = async () => {
    if (seleccionados.length === 0) return;
    await registrar.mutateAsync({
      disciplinaId,
      periodos: seleccionados,
      metodoPago,
      observaciones: observaciones.trim() || undefined,
    });
    setSeleccionados([]);
    setObservaciones('');
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{disciplinaNombre}</h3>
        <span className="text-xs text-slate-500">{cuotas.length} período(s) pendiente(s)</span>
      </div>

      <ul className="divide-y divide-slate-100">
        {cuotas.map((cuota) => (
          <li key={cuota.periodo} className="flex items-center justify-between py-2">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={seleccionados.includes(cuota.periodo)}
                onChange={() => toggle(cuota.periodo)}
              />
              {cuota.periodo}
            </label>
            <span className="text-sm font-medium text-slate-900">{formatMonto(cuota.monto)}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Método de cobro</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPagoSecretaria)}
          >
            {METODOS_PAGO_SECRETARIA.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-600">Observaciones (opcional)</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={observaciones}
            maxLength={255}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: pago en ventanilla"
          />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-600">
          Total seleccionado: <span className="font-semibold text-slate-900">{formatMonto(total)}</span>
        </p>
        <Button
          onClick={() => void onRegistrar()}
          disabled={seleccionados.length === 0 || registrar.isPending}
        >
          {registrar.isPending ? 'Registrando…' : 'Registrar cobro'}
        </Button>
      </div>
    </Card>
  );
}

function CuotasPendientesDeportivas({
  data,
}: {
  data: PendientesDeportivosResponse;
}) {
  const grupos = useMemo(() => {
    const map = new Map<number, { nombre: string; cuotas: CuotaDeportivaPendiente[] }>();
    for (const cuota of data.cuotasPendientes) {
      const grupo = map.get(cuota.disciplinaId) ?? { nombre: cuota.disciplinaNombre, cuotas: [] };
      grupo.cuotas.push(cuota);
      map.set(cuota.disciplinaId, grupo);
    }
    return [...map.entries()];
  }, [data.cuotasPendientes]);

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
          <p className="mt-2 text-sm text-slate-600">
            Total adeudado:{' '}
            <span className="font-semibold text-slate-900">{formatMonto(data.totalAdeudado)}</span>
          </p>
        </div>
      </Card>

      {data.estadoDeuda === 'AL_DIA' ? (
        <Card className="p-6 text-center text-sm text-slate-600">
          El participante está al día con sus cuotas deportivas.
        </Card>
      ) : (
        grupos.map(([disciplinaId, grupo]) => (
          <DisciplinaCobroCard
            key={disciplinaId}
            personaId={data.personaId}
            disciplinaId={disciplinaId}
            disciplinaNombre={grupo.nombre}
            cuotas={grupo.cuotas}
          />
        ))
      )}
    </div>
  );
}

/**
 * US-21 — El secretario (ADMIN/COLABORADOR) registra el pago de una o varias
 * cuotas deportivas de un participante. Paso 1: buscar por DNI. Paso 2: seleccionar
 * los períodos pendientes por disciplina y registrar el cobro.
 */
export function RegistrarPagoDeportivoPage() {
  const navigate = useNavigate();
  const busqueda = useBuscarParticipante();
  const participante = busqueda.participante;
  const { data, isLoading } = usePendientesDeportivos(participante?.id ?? null);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Registrar pago de cuota deportiva
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Buscá al participante por DNI y registrá el pago de uno o varios períodos.
        </p>
      </header>

      <BuscarParticipanteDni
        onBuscar={busqueda.buscar}
        cargando={busqueda.cargando}
        noEncontrado={busqueda.noEncontrado}
        error={busqueda.error}
        onRegistrarNuevo={() => navigate(ROUTES.nuevaInscripcion)}
      />

      {participante && isLoading && (
        <p className="text-sm text-slate-500">Cargando cuotas del participante…</p>
      )}

      {participante && data && <CuotasPendientesDeportivas data={data} />}
    </div>
  );
}
