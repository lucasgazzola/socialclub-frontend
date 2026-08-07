import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { crearEventoSchema, type CrearEventoSchema } from '../schemas';

interface Props {
  onSubmit: (data: CrearEventoSchema) => Promise<void>;
  submitLabel?: string;
}

export function EventoForm({ onSubmit, submitLabel = 'Guardar' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CrearEventoSchema>({
    resolver: zodResolver(crearEventoSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700">
          Nombre del evento
        </label>
        <Input id="nombre" {...register('nombre')} placeholder="Ej: Torneo de Verano" />
        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-slate-700">
          Descripción (opcional)
        </label>
        <Input id="descripcion" {...register('descripcion')} placeholder="Descripción del evento" />
      </div>

      <div>
        <label htmlFor="entradasDisponibles" className="mb-1 block text-sm font-medium text-slate-700">
          Entradas disponibles
        </label>
        <Input
          id="entradasDisponibles"
          type="number"
          {...register('entradasDisponibles', { valueAsNumber: true })}
          placeholder="Ej: 100"
        />
        {errors.entradasDisponibles && (
          <p className="mt-1 text-xs text-red-600">{errors.entradasDisponibles.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  );
}