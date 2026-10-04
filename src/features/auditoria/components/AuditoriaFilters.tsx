import { useEffect, useRef, useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Button, DateInput, Input, Select, StatusTabs } from '@/components/ui';
import { ACCIONES_AUDITORIA } from '../constants';
import type { PeriodoAuditoriaFiltro } from '../types';
import type { AuditoriaFiltrosFormValues } from '../schemas/auditoria-filtros.schema';

interface AuditoriaFiltersProps {
  onFiltrar: (filtros: AuditoriaFiltrosFormValues) => void;
  onLimpiar: () => void;
  filtrosActivos: AuditoriaFiltrosFormValues;
  deshabilitado?: boolean;
}

const TABS_PERIODO: { value: PeriodoAuditoriaFiltro; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: '1h', label: 'Última 1h' },
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: 'personalizado', label: 'Personalizado' },
];

export function AuditoriaFilters({
  onFiltrar,
  onLimpiar,
  filtrosActivos,
  deshabilitado = false,
}: AuditoriaFiltersProps) {
  const [textoEntidad, setTextoEntidad] = useState(filtrosActivos.entidad ?? '');
  const [periodo, setPeriodo] = useState<PeriodoAuditoriaFiltro>(filtrosActivos.periodo ?? 'todo');
  const [accion, setAccion] = useState(filtrosActivos.accion ?? '');
  const [fechaDesde, setFechaDesde] = useState(filtrosActivos.fechaDesde ?? '');
  const [fechaHasta, setFechaHasta] = useState(filtrosActivos.fechaHasta ?? '');
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover de fechas al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverAbierto(false);
      }
    }
    if (popoverAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popoverAbierto]);

  // Sincronizar estado local si filtrosActivos cambia desde el componente padre
  useEffect(() => {
    setTextoEntidad(filtrosActivos.entidad ?? '');
    setPeriodo(filtrosActivos.periodo ?? 'todo');
    setAccion(filtrosActivos.accion ?? '');
    setFechaDesde(filtrosActivos.fechaDesde ?? '');
    setFechaHasta(filtrosActivos.fechaHasta ?? '');
  }, [
    filtrosActivos.entidad,
    filtrosActivos.periodo,
    filtrosActivos.accion,
    filtrosActivos.fechaDesde,
    filtrosActivos.fechaHasta,
  ]);

  // Debounce para el buscador de entidad (300ms)
  useEffect(() => {
    const trimmed = textoEntidad.trim();
    if (trimmed === (filtrosActivos.entidad ?? '')) return;

    const timer = setTimeout(() => {
      onFiltrar({
        ...filtrosActivos,
        entidad: trimmed || undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [textoEntidad, filtrosActivos, onFiltrar]);

  const hayFiltrosActivos =
    Boolean(filtrosActivos.accion) ||
    Boolean(filtrosActivos.entidad) ||
    (Boolean(filtrosActivos.periodo) && filtrosActivos.periodo !== 'todo') ||
    Boolean(filtrosActivos.fechaDesde) ||
    Boolean(filtrosActivos.fechaHasta);

  function handleCambiarPeriodo(nuevoPeriodo: PeriodoAuditoriaFiltro) {
    if (nuevoPeriodo === 'personalizado') {
      setPeriodo('personalizado');
      setPopoverAbierto((prev) => (periodo === 'personalizado' ? !prev : true));
      onFiltrar({
        ...filtrosActivos,
        periodo: 'personalizado',
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
      });
      return;
    }

    setPeriodo(nuevoPeriodo);
    setFechaDesde('');
    setFechaHasta('');
    setErrorFecha(null);
    setPopoverAbierto(false);
    onFiltrar({
      ...filtrosActivos,
      periodo: nuevoPeriodo,
      fechaDesde: undefined,
      fechaHasta: undefined,
    });
  }

  function handleCambiarAccion(nuevaAccion: string) {
    setAccion(nuevaAccion);
    onFiltrar({
      ...filtrosActivos,
      accion: nuevaAccion || undefined,
    });
  }

  function handleFechaDesdeChange(nuevaDesde: string) {
    setFechaDesde(nuevaDesde);
    validarYAplicarFechas(nuevaDesde, fechaHasta);
  }

  function handleFechaHastaChange(nuevaHasta: string) {
    setFechaHasta(nuevaHasta);
    validarYAplicarFechas(fechaDesde, nuevaHasta);
  }

  function validarYAplicarFechas(desde: string, hasta: string) {
    if (desde && hasta && desde > hasta) {
      setErrorFecha('La fecha "Desde" no puede ser posterior a "Hasta"');
      return;
    }
    setErrorFecha(null);
    setPeriodo('personalizado');
    onFiltrar({
      ...filtrosActivos,
      periodo: 'personalizado',
      fechaDesde: desde || undefined,
      fechaHasta: hasta || undefined,
    });
  }

  function handleLimpiarFechasPersonalizadas() {
    setFechaDesde('');
    setFechaHasta('');
    setErrorFecha(null);
    setPeriodo('todo');
    setPopoverAbierto(false);
    onFiltrar({
      ...filtrosActivos,
      periodo: 'todo',
      fechaDesde: undefined,
      fechaHasta: undefined,
    });
  }

  function handleReset() {
    setTextoEntidad('');
    setPeriodo('todo');
    setAccion('');
    setFechaDesde('');
    setFechaHasta('');
    setErrorFecha(null);
    setPopoverAbierto(false);
    onLimpiar();
  }

  return (
    <div className="space-y-3">
      {/* 1. Nivel superior: Pestañas de período rápido (con 'Personalizado' integrado) + Limpiar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative inline-block" ref={popoverRef}>
          <StatusTabs<PeriodoAuditoriaFiltro>
            value={periodo}
            onChange={handleCambiarPeriodo}
            tabs={TABS_PERIODO}
            aria-label="Filtrar por período"
          />

          {/* Accesibilidad y compatibilidad con pruebas automatizadas */}
          <select
            id="filtroPeriodo"
            aria-label="Filtrar por período"
            value={periodo}
            onChange={(e) => handleCambiarPeriodo(e.target.value as PeriodoAuditoriaFiltro)}
            className="sr-only"
            tabIndex={-1}
          >
            {TABS_PERIODO.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>

          {/* Desplegable de rango personalizado anclado justo debajo de las pestañas */}
          {periodo === 'personalizado' && popoverAbierto && (
            <div
              className="absolute left-0 sm:left-auto sm:right-0 top-full z-50 mt-2 w-auto min-w-[310px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-lg ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150"
              role="dialog"
              aria-label="Rango personalizado"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Rango personalizado</span>
                {(fechaDesde || fechaHasta) && (
                  <button
                    type="button"
                    onClick={handleLimpiarFechasPersonalizadas}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Borrar fechas
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-36 sm:w-40">
                  <DateInput
                    id="fechaDesde"
                    label="Desde"
                    value={fechaDesde}
                    onChange={handleFechaDesdeChange}
                    max={fechaHasta || undefined}
                    disabled={deshabilitado}
                  />
                </div>

                <span className="pt-6 text-slate-400 font-medium">—</span>

                <div className="w-36 sm:w-40">
                  <DateInput
                    id="fechaHasta"
                    label="Hasta"
                    value={fechaHasta}
                    onChange={handleFechaHastaChange}
                    min={fechaDesde || undefined}
                    disabled={deshabilitado}
                  />
                </div>
              </div>

              {errorFecha && (
                <p className="mt-2 text-xs font-medium text-rose-600">{errorFecha}</p>
              )}
            </div>
          )}
        </div>

        {hayFiltrosActivos && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={deshabilitado}
            className="text-slate-500 hover:text-slate-800"
          >
            <RotateCcw size={14} />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* 2. Nivel inferior (Patrón US-04 oficial): Buscador a la izquierda y Selector en la esquina derecha */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            id="entidad"
            aria-label="Buscar por entidad"
            placeholder="Buscar por entidad..."
            leftIcon={<Search />}
            autoComplete="off"
            disabled={deshabilitado}
            value={textoEntidad}
            onChange={(e) => setTextoEntidad(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="accion" className="sr-only">
            Acción
          </label>
          <Select
            id="accion"
            aria-label="Filtrar por acción"
            leftIcon={<Filter />}
            className="w-full sm:w-52"
            disabled={deshabilitado}
            value={accion}
            onChange={(e) => handleCambiarAccion(e.target.value)}
          >
            <option value="">Todas las acciones</option>
            {ACCIONES_AUDITORIA.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
