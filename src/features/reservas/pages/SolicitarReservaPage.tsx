import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Info,
  MapPin,
  Send,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import {
  CalendarioDisponibilidad,
  hoyClubIso,
} from '../components/CalendarioDisponibilidad';
import {
  useDisponibilidadEspacio,
  useEspaciosParaReserva,
  usePresupuestoReserva,
  useSolicitarReserva,
} from '../hooks/useReservas';
import { formatearPesos, type Reserva } from '../types';

function rangoMesIso(mes: Date): { desde: string; hasta: string } {
  const anio = mes.getFullYear();
  const m = mes.getMonth();
  const ultimoDia = new Date(anio, m + 1, 0).getDate();
  const mm = String(m + 1).padStart(2, '0');
  return {
    desde: `${anio}-${mm}-01`,
    hasta: `${anio}-${mm}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

function mananaIso(): string {
  const [a, m, d] = hoyClubIso().split('-').map(Number);
  const next = new Date(Date.UTC(a, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

/** US-59 — Solicitar reserva de espacio con calendario, presupuesto y seña. */
export function SolicitarReservaPage() {
  const [searchParams] = useSearchParams();
  const espacioIdParam = Number(searchParams.get('espacioId') || 0);

  const { data: espacios = [], isLoading: cargandoEspacios, error: errorEspacios } =
    useEspaciosParaReserva();

  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [mesActual, setMesActual] = useState<Date>(() => {
    const [a, m] = hoyClubIso().split('-').map(Number);
    return new Date(a, m - 1, 1);
  });
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('18:00');
  const [horaFin, setHoraFin] = useState<string>('20:00');
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

  useEffect(() => {
    if (espacios.length === 0) return;
    if (espacioId !== null && espacios.some((e) => e.id === espacioId)) return;
    const preseleccionado =
      espacioIdParam > 0 ? espacios.find((e) => e.id === espacioIdParam) : undefined;
    setEspacioId(preseleccionado?.id ?? espacios[0].id);
  }, [espacios, espacioId, espacioIdParam]);

  const espacioSeleccionado = useMemo(
    () => espacios.find((e) => e.id === espacioId) ?? null,
    [espacios, espacioId],
  );

  useEffect(() => {
    if (!espacioSeleccionado) return;
    if (espacioSeleccionado.modalidad === 'DIA_COMPLETO' && fecha && fecha <= hoyClubIso()) {
      setFecha(mananaIso());
    }
  }, [espacioSeleccionado, fecha]);

  const { desde, hasta } = useMemo(() => rangoMesIso(mesActual), [mesActual]);

  const { data: disponibilidad, isFetching: cargandoDisponibilidad } = useDisponibilidadEspacio(
    espacioSeleccionado?.id ?? null,
    desde,
    hasta,
  );

  const presupuestoInput = useMemo(() => {
    if (!espacioSeleccionado || !fecha) return null;
    if (espacioSeleccionado.modalidad === 'POR_HORA') {
      if (!horaInicio || !horaFin || horaFin <= horaInicio) return null;
      return {
        espacioId: espacioSeleccionado.id,
        fecha,
        horaInicio,
        horaFin,
      };
    }
    return {
      espacioId: espacioSeleccionado.id,
      fecha,
    };
  }, [espacioSeleccionado, fecha, horaInicio, horaFin]);

  const {
    data: presupuesto,
    isFetching: cargandoPresupuesto,
    error: errorPresupuesto,
  } = usePresupuestoReserva(presupuestoInput);

  const solicitarMutation = useSolicitarReserva();

  const handleSeleccionarEspacio = (id: number) => {
    setEspacioId(id);
    setFecha('');
    setReservaCreada(null);
    solicitarMutation.reset();
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!espacioSeleccionado || !fecha || !presupuesto?.disponible) return;
    const res = await solicitarMutation.mutateAsync({
      espacioId: espacioSeleccionado.id,
      fecha,
      ...(espacioSeleccionado.modalidad === 'POR_HORA' ? { horaInicio, horaFin } : {}),
    });
    setReservaCreada(res.reserva);
  };

  if (reservaCreada) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Solicitud de reserva enviada</h1>
              <p className="text-sm text-emerald-900">
                Tu solicitud quedó registrada en estado{' '}
                <strong>Pendiente de aprobación</strong>. Te avisaremos cuando la administración la
                evalúe.
              </p>
              <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Código de seguimiento
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-indigo-700">
                  {reservaCreada.codigo}
                </p>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Espacio</dt>
                    <dd className="font-medium">{reservaCreada.espacio.nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Turno</dt>
                    <dd className="font-medium">{reservaCreada.turno}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Presupuesto total</dt>
                    <dd className="font-medium">{formatearPesos(reservaCreada.montoTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Seña requerida tras aprobación</dt>
                    <dd className="font-medium">{formatearPesos(reservaCreada.montoSena)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={ROUTES.misReservas}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Ir a Mis reservas
            </Link>
            <button
              type="button"
              onClick={() => {
                setReservaCreada(null);
                setFecha('');
                solicitarMutation.reset();
              }}
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
            >
              Hacer otra solicitud
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitar reserva de espacio</h1>
          <p className="mt-1 text-sm text-slate-600">
            Elegí el espacio, consultá la disponibilidad y revisá el presupuesto y la seña antes de
            enviar tu solicitud.
          </p>
        </div>
        <Link
          to={ROUTES.misReservas}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver Mis reservas
        </Link>
      </div>

      {cargandoEspacios && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Cargando espacios disponibles…
        </div>
      )}

      {errorEspacios && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudieron cargar los espacios disponibles. Intentá nuevamente.
        </div>
      )}

      {!cargandoEspacios && !errorEspacios && espacios.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No hay espacios habilitados para reservas en este momento.
        </div>
      )}

      {espacioSeleccionado && (
        <form onSubmit={handleEnviar} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Selector de espacio */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <label
                htmlFor="espacio-select"
                className="block text-sm font-semibold text-slate-900"
              >
                1. Elegí el espacio
              </label>
              <select
                id="espacio-select"
                value={espacioSeleccionado.id}
                onChange={(e) => handleSeleccionarEspacio(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                {espacios.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} ({e.modalidad === 'POR_HORA' ? 'Por hora' : 'Día completo'}) —{' '}
                    {formatearPesos(e.precio)}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  {espacioSeleccionado.modalidad === 'POR_HORA' ? 'Por hora' : 'Día completo'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  Capacidad: {espacioSeleccionado.capacidadMaxima} personas
                </span>
                {espacioSeleccionado.ubicacion && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {espacioSeleccionado.ubicacion}
                  </span>
                )}
              </div>
              {espacioSeleccionado.descripcion && (
                <p className="mt-2 text-xs text-slate-500">{espacioSeleccionado.descripcion}</p>
              )}
            </section>

            {/* 2. Calendario de disponibilidad */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  2. Seleccioná fecha{espacioSeleccionado.modalidad === 'POR_HORA' ? ' y horario' : ''}
                </h2>
                {espacioSeleccionado.modalidad === 'DIA_COMPLETO' && (
                  <span className="text-xs text-slate-500">
                    Disponible a partir de mañana
                  </span>
                )}
              </div>

              <CalendarioDisponibilidad
                modalidad={espacioSeleccionado.modalidad}
                mesActual={mesActual}
                onCambiarMes={setMesActual}
                ocupados={disponibilidad?.ocupados ?? []}
                cargando={cargandoDisponibilidad}
                fechaSeleccionada={fecha}
                onSeleccionarFecha={(f) => {
                  setFecha(f);
                  solicitarMutation.reset();
                }}
                horaInicio={horaInicio}
                horaFin={horaFin}
                onCambiarHorario={(ini, fin) => {
                  setHoraInicio(ini);
                  setHoraFin(fin);
                  solicitarMutation.reset();
                }}
              />
            </section>
          </div>

          {/* Panel derecho: Presupuesto y Seña */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <CalendarCheck className="h-5 w-5 text-indigo-600" />
                Resumen y presupuesto
              </h2>

              {!fecha && (
                <p className="mt-4 text-sm text-slate-500">
                  Seleccioná una fecha en el calendario para ver la disponibilidad y el presupuesto
                  estimado.
                </p>
              )}

              {fecha && cargandoPresupuesto && (
                <p className="mt-4 text-sm text-slate-500">Calculando presupuesto…</p>
              )}

              {fecha && errorPresupuesto && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {(errorPresupuesto as { response?: { data?: { message?: string } } })?.response
                    ?.data?.message ?? 'No se pudo calcular el presupuesto para ese turno.'}
                </div>
              )}

              {presupuesto && !cargandoPresupuesto && (
                <div className="mt-4 space-y-4">
                  <div
                    className={[
                      'flex items-start gap-2 rounded-lg p-3 text-xs font-medium',
                      presupuesto.disponible
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-rose-200 bg-rose-50 text-rose-800',
                    ].join(' ')}
                  >
                    {presupuesto.disponible ? (
                      <>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Espacio disponible para el turno seleccionado.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <span>
                          No disponible: {presupuesto.conflictos[0]?.detalle ?? 'Horario ocupado'}
                        </span>
                      </>
                    )}
                  </div>

                  <dl className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <dt>Modalidad</dt>
                      <dd className="font-medium text-slate-900">
                        {presupuesto.modalidad === 'POR_HORA'
                          ? `${presupuesto.cantidad} ${presupuesto.cantidad === 1 ? 'hora' : 'horas'}`
                          : 'Día completo'}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Tarifa regular</dt>
                      <dd>{formatearPesos(presupuesto.montoRegular)}</dd>
                    </div>
                    {presupuesto.aplicaTarifaSocio && presupuesto.descuentoAplicado > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <dt>Descuento socio al día</dt>
                        <dd>-{formatearPesos(presupuesto.descuentoAplicado)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                      <dt>Total estimado</dt>
                      <dd>{formatearPesos(presupuesto.montoTotal)}</dd>
                    </div>
                  </dl>

                  {presupuesto.esSocio && !presupuesto.alDia && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        Tenés {presupuesto.cuotasAdeudadas}{' '}
                        {presupuesto.cuotasAdeudadas === 1 ? 'cuota pendiente' : 'cuotas pendientes'}.
                        El descuento de socio aplica solo estando al día.
                      </span>
                    </div>
                  )}

                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-950">
                    <p className="font-semibold">
                      Seña obligatoria: {formatearPesos(presupuesto.montoSena)}
                    </p>
                    <p className="mt-1 text-indigo-800">
                      No abonás nada ahora. Si se acepta tu solicitud, tendrás que
                      pagar esta seña para confirmar.
                    </p>
                  </div>

                  {solicitarMutation.error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {(solicitarMutation.error as { response?: { data?: { message?: string } } })
                        ?.response?.data?.message ?? 'No se pudo enviar la solicitud.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!presupuesto.disponible || solicitarMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Send className="h-4 w-4" />
                    {solicitarMutation.isPending ? 'Enviando solicitud…' : 'Solicitar reserva'}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}
