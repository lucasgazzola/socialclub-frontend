import { ChevronLeft, ChevronRight, Clock, Lock } from 'lucide-react';
import type { IntervaloOcupado } from '../types';

const MS_MINUTO = 60_000;
const MS_DIA = 86_400_000;
const HUSO_CLUB_MINUTOS = -180;

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const HORAS_INICIO = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
export const HORAS_FIN = Array.from({ length: 17 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

/** Fecha actual en el reloj del club (UTC-3), formato YYYY-MM-DD. */
export function hoyClubIso(ahora = new Date()): string {
  const local = new Date(ahora.getTime() + HUSO_CLUB_MINUTOS * MS_MINUTO);
  return local.toISOString().slice(0, 10);
}

/** Instante UTC correspondiente a una fecha YYYY-MM-DD y hora HH:MM en el club (UTC-3). */
export function instanteClubDesdeIso(fechaIso: string, hora = '00:00'): Date {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (hora === '24:00') {
    return new Date(Date.UTC(anio, mes - 1, dia, 0, 0) - HUSO_CLUB_MINUTOS * MS_MINUTO + MS_DIA);
  }
  const [h, m] = hora.split(':').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia, h, m) - HUSO_CLUB_MINUTOS * MS_MINUTO);
}

interface CalendarioDisponibilidadProps {
  modalidad: 'POR_HORA' | 'DIA_COMPLETO';
  mesActual: Date;
  onCambiarMes: (nuevoMes: Date) => void;
  ocupados: IntervaloOcupado[];
  cargando?: boolean;
  fechaSeleccionada: string;
  onSeleccionarFecha: (fecha: string) => void;
  horaInicio: string;
  horaFin: string;
  onCambiarHorario: (horaInicio: string, horaFin: string) => void;
}

export function CalendarioDisponibilidad({
  modalidad,
  mesActual,
  onCambiarMes,
  ocupados,
  cargando = false,
  fechaSeleccionada,
  onSeleccionarFecha,
  horaInicio,
  horaFin,
  onCambiarHorario,
}: CalendarioDisponibilidadProps) {
  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const hoyIso = hoyClubIso();
  const ahoraMs = Date.now();

  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0 = Lun
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const intervalosMs = ocupados.map((o) => ({
    ...o,
    inicioMs: new Date(o.inicio).getTime(),
    finMs: new Date(o.fin).getTime(),
  }));

  const conflictoEnRango = (inicioMs: number, finMs: number) =>
    intervalosMs.find((i) => i.inicioMs < finMs && inicioMs < i.finMs);

  const estadoDia = (fechaIso: string) => {
    const esPasado = modalidad === 'DIA_COMPLETO' ? fechaIso <= hoyIso : fechaIso < hoyIso;
    if (esPasado) {
      return { deshabilitado: true, ocupadoTotal: false, parcial: false, motivo: 'Fecha no disponible' };
    }

    const diaInicioMs = instanteClubDesdeIso(fechaIso, '00:00').getTime();
    const diaFinMs = instanteClubDesdeIso(fechaIso, '24:00').getTime();
    const conflictosDia = intervalosMs.filter((i) => i.inicioMs < diaFinMs && diaInicioMs < i.finMs);

    if (modalidad === 'DIA_COMPLETO') {
      const ocupado = conflictosDia.length > 0;
      return {
        deshabilitado: ocupado,
        ocupadoTotal: ocupado,
        parcial: false,
        motivo: ocupado ? conflictosDia[0].detalle : '',
      };
    }

    let bloquesLibres = 0;
    const limiteAnticipacionMs = ahoraMs + 30 * MS_MINUTO;
    for (let i = 0; i < HORAS_INICIO.length; i++) {
      const sInicio = instanteClubDesdeIso(fechaIso, HORAS_INICIO[i]).getTime();
      const sFin = instanteClubDesdeIso(fechaIso, HORAS_FIN[i]).getTime();
      const sinAnticipacion = sInicio <= limiteAnticipacionMs;
      if (!sinAnticipacion && !conflictoEnRango(sInicio, sFin)) {
        bloquesLibres++;
      }
    }

    return {
      deshabilitado: bloquesLibres === 0,
      ocupadoTotal: bloquesLibres === 0 && conflictosDia.length > 0,
      parcial: bloquesLibres > 0 && conflictosDia.length > 0,
      motivo: conflictosDia[0]?.detalle ?? '',
    };
  };

  const celdas: (number | null)[] = [
    ...Array.from({ length: primerDiaSemana }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const bloquesDiaSeleccionado =
    modalidad === 'POR_HORA' && fechaSeleccionada
      ? HORAS_INICIO.map((hIni, idx) => {
          const hFin = HORAS_FIN[idx];
          const sInicio = instanteClubDesdeIso(fechaSeleccionada, hIni).getTime();
          const sFin = instanteClubDesdeIso(fechaSeleccionada, hFin).getTime();
          const conflicto = conflictoEnRango(sInicio, sFin);
          const yaPaso = sInicio <= ahoraMs;
          const sinAnticipacion = !yaPaso && sInicio <= ahoraMs + 30 * MS_MINUTO;
          return {
            hIni,
            hFin,
            ocupado: Boolean(conflicto) || yaPaso || sinAnticipacion,
            detalle:
              conflicto?.detalle ??
              (yaPaso
                ? 'Horario pasado'
                : sinAnticipacion
                  ? 'Requiere al menos 30 min de anticipación'
                  : ''),
          };
        })
      : [];

  const handleClickBloque = (hIni: string, hFin: string) => {
    if (!horaInicio || !horaFin || hIni < horaInicio || hFin <= horaFin) {
      onCambiarHorario(hIni, hFin);
      return;
    }
    const idxIni = HORAS_INICIO.indexOf(horaInicio);
    const idxFin = HORAS_FIN.indexOf(hFin);
    const hayBloqueOcupadoEnMedio = bloquesDiaSeleccionado
      .slice(idxIni, idxFin + 1)
      .some((b) => b.ocupado);
    if (hayBloqueOcupadoEnMedio) {
      onCambiarHorario(hIni, hFin);
    } else {
      onCambiarHorario(horaInicio, hFin);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera del calendario */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onCambiarMes(new Date(anio, mes - 1, 1))}
            aria-label="Mes anterior"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-slate-900">
            {MESES[mes]} {anio}
            {cargando && <span className="ml-2 text-xs font-normal text-slate-400">Actualizando…</span>}
          </div>
          <button
            type="button"
            onClick={() => onCambiarMes(new Date(anio, mes + 1, 1))}
            aria-label="Mes siguiente"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grilla de días */}
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, idx) => {
            if (dia === null) {
              return <div key={`vacio-${idx}`} className="h-10" />;
            }
            const fechaIso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const { deshabilitado, ocupadoTotal, parcial, motivo } = estadoDia(fechaIso);
            const seleccionado = fechaSeleccionada === fechaIso;

            return (
              <button
                key={fechaIso}
                type="button"
                disabled={deshabilitado}
                title={motivo || undefined}
                aria-label={`Día ${fechaIso}${deshabilitado ? ' no disponible' : ''}`}
                onClick={() => onSeleccionarFecha(fechaIso)}
                className={[
                  'relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors',
                  seleccionado
                    ? 'bg-indigo-600 font-semibold text-white'
                    : deshabilitado
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400 line-through'
                      : 'border border-slate-200 bg-white font-medium text-slate-800 hover:border-indigo-300 hover:bg-indigo-50',
                ].join(' ')}
              >
                <span>{dia}</span>
                {parcial && !seleccionado && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />
                )}
                {ocupadoTotal && (
                  <span className="sr-only">Ocupado</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Disponible
          </span>
          {modalidad === 'POR_HORA' && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Con horarios ocupados
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-200" /> Bloqueado / No disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-indigo-600" /> Seleccionado
          </span>
        </div>
      </div>

      {/* Selector de rango horario para modalidad POR_HORA */}
      {modalidad === 'POR_HORA' && fechaSeleccionada && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-indigo-600" />
              Horarios para el {fechaSeleccionada}
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 text-slate-600">
                Desde
                <select
                  aria-label="Hora de inicio"
                  value={horaInicio}
                  onChange={(e) => {
                    const nuevaIni = e.target.value;
                    const idxIni = HORAS_INICIO.indexOf(nuevaIni);
                    const finValida =
                      horaFin > nuevaIni ? horaFin : (HORAS_FIN[idxIni] ?? '24:00');
                    onCambiarHorario(nuevaIni, finValida);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                >
                  {HORAS_INICIO.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-slate-600">
                Hasta
                <select
                  aria-label="Hora de fin"
                  value={horaFin}
                  onChange={(e) => onCambiarHorario(horaInicio, e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                >
                  {HORAS_FIN.filter((h) => h > horaInicio).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {bloquesDiaSeleccionado.map((b) => {
              const enRango = !b.ocupado && b.hIni >= horaInicio && b.hFin <= horaFin;
              return (
                <button
                  key={b.hIni}
                  type="button"
                  disabled={b.ocupado}
                  title={b.detalle || `${b.hIni} a ${b.hFin}`}
                  onClick={() => handleClickBloque(b.hIni, b.hFin)}
                  className={[
                    'flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    b.ocupado
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                      : enRango
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50',
                  ].join(' ')}
                >
                  {b.ocupado && <Lock className="h-3 w-3 shrink-0" />}
                  <span>
                    {b.hIni}–{b.hFin}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Hacé clic en un bloque libre para iniciar y en otro posterior para extender el turno.
          </p>
        </div>
      )}
    </div>
  );
}
