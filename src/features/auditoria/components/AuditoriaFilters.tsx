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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Selector de Acción */}
        <div className="w-full lg:w-56">
          <label
            htmlFor="accion"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Acción
          </label>
          <Select
            id="accion"
            {...register('accion')}
            leftIcon={<Filter />}
            className="w-full"
            disabled={deshabilitado}
          >
            <option value="">Todas las acciones</option>
            {ACCIONES_AUDITORIA.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Búsqueda por Entidad */}
        <div className="w-full lg:w-64">
          <Input
            id="entidad"
            label="Entidad"
            placeholder="Buscar por entidad..."
            leftIcon={<Search />}
            autoComplete="off"
            disabled={deshabilitado}
            {...register('entidad')}
          />
        </div>

        {/* Rango de fechas: Desde */}
        <div className="w-full sm:w-44">
          <Input
            id="fechaDesde"
            type="date"
            label="Desde"
            disabled={deshabilitado}
            {...register('fechaDesde')}
          />
        </div>

        {/* Rango de fechas: Hasta */}
        <div className="w-full sm:w-44">
          <Input
            id="fechaHasta"
            type="date"
            label="Hasta"
            error={errors.fechaHasta?.message}
            disabled={deshabilitado}
            {...register('fechaHasta')}
          />
        </div>

        {/* Acciones de filtro */}
        <div className="flex items-center gap-2 pt-1 lg:pt-0">
          <Button type="submit" variant="primary" size="md" disabled={deshabilitado}>
            <Filter size={15} />
            Filtrar
          </Button>

          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleReset}
              disabled={deshabilitado}
              className="text-slate-600 hover:text-slate-900"
            >
              <RotateCcw size={14} />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
