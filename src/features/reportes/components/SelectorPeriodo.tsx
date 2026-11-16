import { useEffect, useMemo, useState } from 'react';
import { Select, StatusTabs } from '@/components/ui';
import {
  aniosDisponibles,
  aPeriodo,
  MESES,
  rangoDeTrimestre,
  trimestreDe,
  type Rango,
  type TipoPeriodo,
} from '../periodo';

interface SelectorPeriodoProps {
  /** Se llama con el rango elegido; `null` si el rango personalizado es inválido. */
  onChange: (rango: Rango | null) => void;
  hoy?: Date;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * US-35 — Período del reporte: un mes, un trimestre o un rango de meses
 * personalizado. Arranca en el trimestre en curso. Usa selects de mes y año
 * (no el input nativo de mes, que cada navegador muestra distinto; ver DT-40).
 */
export function SelectorPeriodo({ onChange, hoy = new Date() }: SelectorPeriodoProps) {
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  const anios = useMemo(() => aniosDisponibles(hoy), [hoy]);

  const [tipo, setTipo] = useState<TipoPeriodo>('trimestre');
  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState(mesActual);
  const [trimestre, setTrimestre] = useState(trimestreDe(mesActual));
  const [desde, setDesde] = useState({ anio: anioActual, mes: 1 });
  const [hasta, setHasta] = useState({ anio: anioActual, mes: mesActual });

  const rango: Rango | null = useMemo(() => {
    if (tipo === 'mes') return { desde: aPeriodo(anio, mes), hasta: aPeriodo(anio, mes) };
    if (tipo === 'trimestre') return rangoDeTrimestre(anio, trimestre);
    const r = { desde: aPeriodo(desde.anio, desde.mes), hasta: aPeriodo(hasta.anio, hasta.mes) };
    return r.desde <= r.hasta ? r : null;
  }, [tipo, anio, mes, trimestre, desde, hasta]);

  useEffect(() => {
    onChange(rango);
  }, [rango, onChange]);

  const selectMes = (id: string, label: string, valor: number, cambiar: (m: number) => void) => (
    <Select
      id={id}
      aria-label={label}
      value={String(valor)}
      onChange={(e) => cambiar(Number(e.target.value))}
    >
      {MESES.map((nombre, i) => (
        <option key={nombre} value={i + 1}>
          {capitalizar(nombre)}
        </option>
      ))}
    </Select>
  );
  const selectAnio = (id: string, label: string, valor: number, cambiar: (a: number) => void) => (
    <Select
      id={id}
      aria-label={label}
      value={String(valor)}
      onChange={(e) => cambiar(Number(e.target.value))}
    >
      {anios.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatusTabs<TipoPeriodo>
        aria-label="Tipo de período"
        value={tipo}
        onChange={setTipo}
        tabs={[
          { value: 'mes', label: 'Mes' },
          { value: 'trimestre', label: 'Trimestre' },
          { value: 'rango', label: 'Rango' },
        ]}
      />

      {tipo === 'mes' && (
        <div className="flex gap-2">
          <div className="w-36">{selectMes('periodo-mes', 'Mes', mes, setMes)}</div>
          <div className="w-28">{selectAnio('periodo-anio', 'Año', anio, setAnio)}</div>
        </div>
      )}

      {tipo === 'trimestre' && (
        <div className="flex gap-2">
          <div className="w-56">
            <Select
              id="periodo-trimestre"
              aria-label="Trimestre"
              value={String(trimestre)}
              onChange={(e) => setTrimestre(Number(e.target.value))}
            >
              <option value="1">1.º trimestre (ene–mar)</option>
              <option value="2">2.º trimestre (abr–jun)</option>
              <option value="3">3.º trimestre (jul–sep)</option>
              <option value="4">4.º trimestre (oct–dic)</option>
            </Select>
          </div>
          <div className="w-28">{selectAnio('periodo-anio', 'Año', anio, setAnio)}</div>
        </div>
      )}

      {tipo === 'rango' && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Desde</span>
          <div className="w-36">
            {selectMes('rango-desde-mes', 'Mes desde', desde.mes, (m) =>
              setDesde((d) => ({ ...d, mes: m })),
            )}
          </div>
          <div className="w-28">
            {selectAnio('rango-desde-anio', 'Año desde', desde.anio, (a) =>
              setDesde((d) => ({ ...d, anio: a })),
            )}
          </div>
          <span>hasta</span>
          <div className="w-36">
            {selectMes('rango-hasta-mes', 'Mes hasta', hasta.mes, (m) =>
              setHasta((h) => ({ ...h, mes: m })),
            )}
          </div>
          <div className="w-28">
            {selectAnio('rango-hasta-anio', 'Año hasta', hasta.anio, (a) =>
              setHasta((h) => ({ ...h, anio: a })),
            )}
          </div>
          {!rango && (
            <span role="alert" className="text-xs text-rose-600">
              «Desde» no puede ser posterior a «hasta».
            </span>
          )}
        </div>
      )}
    </div>
  );
}
