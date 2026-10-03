import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { ACCIONES_AUDITORIA } from '../constants';
import {
  auditoriaFiltrosSchema,
  type AuditoriaFiltrosFormValues,
} from '../schemas/auditoria-filtros.schema';

interface AuditoriaFiltersProps {
  onFiltrar: (filtros: AuditoriaFiltrosFormValues) => void;
  onLimpiar: () => void;
  filtrosActivos: AuditoriaFiltrosFormValues;
  deshabilitado?: boolean;
}

export function AuditoriaFilters({
  onFiltrar,
  onLimpiar,
  filtrosActivos,
  deshabilitado = false,
}: AuditoriaFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuditoriaFiltrosFormValues>({
    resolver: zodResolver(auditoriaFiltrosSchema),
    defaultValues: {
      accion: filtrosActivos.accion ?? '',
      entidad: filtrosActivos.entidad ?? '',
      fechaDesde: filtrosActivos.fechaDesde ?? '',
      fechaHasta: filtrosActivos.fechaHasta ?? '',
    },
  });

  const hayFiltrosActivos =
    Boolean(filtrosActivos.accion) ||
    Boolean(filtrosActivos.entidad) ||
    Boolean(filtrosActivos.fechaDesde) ||
    Boolean(filtrosActivos.fechaHasta);

  function onSubmit(values: AuditoriaFiltrosFormValues) {
    onFiltrar(values);
  }

  function handleReset() {
    reset({
      accion: '',
      entidad: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    onLimpiar();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Fila principal idéntica a Usuarios, Socios y Participantes:
          Buscador a la izquierda y Selector desplegable a la derecha */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            id="entidad"
            aria-label="Buscar por entidad"
            placeholder="Buscar por entidad..."
            leftIcon={<Search />}
            autoComplete="off"
            disabled={deshabilitado}
            {...register('entidad')}
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
            {...register('accion', {
              onChange: () => {
                void handleSubmit(onSubmit)();
              },
            })}
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

      {/* Fila secundaria: Rango de fechas y botones de acción */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="fechaDesde"
            className="text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Desde
          </label>
          <input
            id="fechaDesde"
            type="date"
            disabled={deshabilitado}
            className="h-9.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('fechaDesde')}
          />
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="fechaHasta"
            className="text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Hasta
          </label>
          <input
            id="fechaHasta"
            type="date"
            disabled={deshabilitado}
            className="h-9.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('fechaHasta')}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" size="sm" disabled={deshabilitado}>
            <Filter size={14} />
            Filtrar
          </Button>

          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={deshabilitado}
              className="text-slate-600 hover:text-slate-900"
            >
              <RotateCcw size={14} />
              Limpiar
            </Button>
          )}
        </div>

        {errors.fechaHasta?.message && (
          <span className="w-full text-xs font-medium text-rose-600 sm:w-auto">
            {errors.fechaHasta.message}
          </span>
        )}
      </div>
    </form>
  );
}
