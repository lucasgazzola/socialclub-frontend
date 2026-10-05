import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import { Button, DateTimeInput, Input, Select, ModalActions } from '@/components/ui';
import { crearEventoSchema, type CrearEventoSchema } from '../schemas';
import type { z } from 'zod';

/** Tipo de entrada para el formulario (campos con .default() son opcionales en el form) */
type CrearEventoInput = z.input<typeof crearEventoSchema>;

export interface EventoFormValues extends CrearEventoSchema {
  imagenFile?: File | null;
  tempPreviewUrl?: string | null;
}

interface Props {
  onSubmit: (data: EventoFormValues) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

/** Opciones de descuento: 0%, 5%, 10%, …, 100% */
const OPCIONES_DESCUENTO = Array.from({ length: 21 }, (_, i) => i * 5);

export function EventoForm({ onSubmit, submitLabel = 'Guardar', onCancel }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CrearEventoInput, unknown, CrearEventoSchema>({
    resolver: zodResolver(crearEventoSchema),
    defaultValues: {
      requiereEntrada: true,
      estado: 'PUBLICADO',
      precio: 0,
      descuentoSocio: 0,
      capacidadMaxima: 100,
      entradasDisponibles: 100,
      lugarAcreditacion: 'Club Social y Deportivo',
    },
  });

  const requiereEntrada = watch('requiereEntrada');
  const precio = watch('precio');

  // Manejar creación y revocación de URL de objeto para vista previa de imagen local
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  async function handleFormSubmit(data: CrearEventoSchema) {
    await onSubmit({
      ...data,
      imagenFile: selectedFile,
      tempPreviewUrl: previewUrl,
    });
  }

  const puedeDescuento = requiereEntrada && (precio ?? 0) > 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>

      {/* ─── Imagen ─── */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Imagen del evento (solo vista previa local)
        </label>
        <p className="mb-2 text-xs text-slate-500">
          La imagen se guarda solo en memoria local para esta sesión y no se sube al servidor.
        </p>
        {previewUrl ? (
          <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img src={previewUrl} alt="Vista previa" className="h-32 w-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
              title="Quitar imagen"
              aria-label="Quitar imagen"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-2 pb-3">
              <ImagePlus className="mb-1 h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="text-xs text-slate-600 font-medium">Seleccionar imagen desde tu dispositivo</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      {/* ─── Nombre ─── */}
      <div>
        <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700">
          Nombre del evento *
        </label>
        <Input id="nombre" {...register('nombre')} placeholder="Ej: Torneo de Pádel Abierto 2026" />
        {errors.nombre && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.nombre.message}</p>}
      </div>

      {/* ─── Descripción ─── */}
      <div>
        <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-slate-700">
          Descripción (opcional)
        </label>
        <Input id="descripcion" {...register('descripcion')} placeholder="Detalles y requisitos del evento" />
      </div>

      {/* ─── Lugar de acreditación ─── */}
      <div>
        <label htmlFor="lugarAcreditacion" className="mb-1 block text-sm font-medium text-slate-700">
          Lugar de acreditación *
        </label>
        <Input id="lugarAcreditacion" {...register('lugarAcreditacion')} placeholder="Ej: Salón principal" />
        {errors.lugarAcreditacion && (
          <p className="mt-1 text-xs text-rose-600" role="alert">{errors.lugarAcreditacion.message}</p>
        )}
      </div>

      {/* ─── Estado ─── */}
      <div>
        <label htmlFor="estado" className="mb-1 block text-sm font-medium text-slate-700">
          Estado del evento
        </label>
        <Select id="estado" {...register('estado')}>
          <option value="PUBLICADO">Publicado</option>
          <option value="BORRADOR">Borrador</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="FINALIZADO">Finalizado</option>
        </Select>
        {errors.estado && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.estado.message}</p>}
      </div>

      {/* ─── Requiere entrada ─── */}
      <div className="flex items-center gap-3">
        <input
          id="requiereEntrada"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          {...register('requiereEntrada')}
        />
        <label htmlFor="requiereEntrada" className="text-sm font-medium text-slate-700 cursor-pointer">
          El evento requiere entradas / tickets
        </label>
      </div>

      {/* ─── Entradas y Capacidad (solo si requiere entrada) ─── */}
      {requiereEntrada && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacidadMaxima" className="mb-1 block text-sm font-medium text-slate-700">
              Capacidad máxima
            </label>
            <Input
              id="capacidadMaxima"
              type="number"
              min={1}
              {...register('capacidadMaxima', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.capacidadMaxima && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.capacidadMaxima.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="entradasDisponibles" className="mb-1 block text-sm font-medium text-slate-700">
              Entradas disponibles
            </label>
            <Input
              id="entradasDisponibles"
              type="number"
              min={0}
              {...register('entradasDisponibles', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.entradasDisponibles && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.entradasDisponibles.message}</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Precio y Descuento (solo si requiere entrada) ─── */}
      {requiereEntrada && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="precio" className="mb-1 block text-sm font-medium text-slate-700">
              Precio ($ ARS, 0 si es gratis)
            </label>
            <Input
              id="precio"
              type="number"
              min={0}
              {...register('precio', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.precio && <p className="mt-1 text-xs text-rose-600" role="alert">{errors.precio.message}</p>}
          </div>

          <div>
            <label htmlFor="descuentoSocio" className="mb-1 block text-sm font-medium text-slate-700">
              Descuento para socios
            </label>
            <Controller
              name="descuentoSocio"
              control={control}
              render={({ field }) => (
                <Select
                  id="descuentoSocio"
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={!puedeDescuento}
                  title={!puedeDescuento ? 'Requiere entradas con precio mayor a 0' : undefined}
                >
                  {OPCIONES_DESCUENTO.map((v) => (
                    <option key={v} value={v}>
                      {v === 0 ? 'Sin descuento' : `${v}% OFF`}
                    </option>
                  ))}
                </Select>
              )}
            />
            {!puedeDescuento && (
              <p className="mt-1 text-xs text-slate-400">
                Disponible solo con precio mayor a $0
              </p>
            )}
            {errors.descuentoSocio && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.descuentoSocio.message}</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Fechas del evento ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fechaEvento" className="mb-1 block text-sm font-medium text-slate-700">
            Fecha de inicio del evento *
          </label>
          <Controller
            control={control}
            name="fechaEvento"
            render={({ field }) => (
              <DateTimeInput
                id="fechaEvento"
                etiquetaHora="Hora de inicio del evento"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.fechaEvento}
              />
            )}
          />
          {errors.fechaEvento && (
            <p className="mt-1 text-xs text-rose-600" role="alert">{errors.fechaEvento.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="fechaFin" className="mb-1 block text-sm font-medium text-slate-700">
            Fecha de fin del evento (opcional)
          </label>
          <Controller
            control={control}
            name="fechaFin"
            render={({ field }) => (
              <DateTimeInput
                id="fechaFin"
                etiquetaHora="Hora de fin del evento"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.fechaFin}
              />
            )}
          />
          {errors.fechaFin && (
            <p className="mt-1 text-xs text-rose-600" role="alert">{errors.fechaFin.message}</p>
          )}
        </div>
      </div>

      {/* ─── Fechas de venta (solo si requiere entrada) ─── */}
      {requiereEntrada && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inicioVenta" className="mb-1 block text-sm font-medium text-slate-700">
              Inicio de venta de entradas (opcional)
            </label>
            <Controller
              control={control}
              name="inicioVenta"
              render={({ field }) => (
                <DateTimeInput
                  id="inicioVenta"
                  etiquetaHora="Hora de inicio de venta"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.inicioVenta}
                />
              )}
            />
            {errors.inicioVenta && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.inicioVenta.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="finVenta" className="mb-1 block text-sm font-medium text-slate-700">
              Fin de venta de entradas (opcional)
            </label>
            <Controller
              control={control}
              name="finVenta"
              render={({ field }) => (
                <DateTimeInput
                  id="finVenta"
                  etiquetaHora="Hora de fin de venta"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.finVenta}
                />
              )}
            />
            {errors.finVenta && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{errors.finVenta.message}</p>
            )}
          </div>
        </div>
      )}

      <ModalActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </ModalActions>
    </form>
  );
}