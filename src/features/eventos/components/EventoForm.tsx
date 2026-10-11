import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import { Button, DateTimeInput, Input, Select, ModalActions } from '@/components/ui';
import {
  crearEventoSchema,
  actualizarEventoSchema,
  type CrearEventoSchema,
  type ActualizarEventoSchema,
} from '../schemas';
import type { Evento } from '../types';
import type { z } from 'zod';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convierte un instante ISO (ej. "2027-01-15T18:00:00.000Z") a formato
 * datetime-local ("2027-01-15T15:00") ajustado a la zona de Buenos Aires.
 */
function isoADatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const ba = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  // sv-SE produce "2027-01-15 15:00" → reemplazar espacio por T
  return ba.replace(' ', 'T');
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ModoFormulario = 'crear' | 'editar';

/** Input del formulario (pre-transform por Zod) */
type CrearEventoInput = z.input<typeof crearEventoSchema>;
type ActualizarEventoInput = z.input<typeof actualizarEventoSchema>;

export interface EventoFormValues extends CrearEventoSchema {
  imagenFile?: File | null;
  tempPreviewUrl?: string | null;
}

export interface ActualizarEventoFormValues extends ActualizarEventoSchema {
  imagenFile?: File | null;
  tempPreviewUrl?: string | null;
}

interface PropsCrear {
  modo?: 'crear';
  eventoInicial?: undefined;
  onSubmit: (data: EventoFormValues) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

interface PropsEditar {
  modo: 'editar';
  eventoInicial: Evento;
  onSubmit: (data: ActualizarEventoFormValues) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

type Props = PropsCrear | PropsEditar;

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Opciones de descuento: 0%, 5%, 10%, …, 100% */
const OPCIONES_DESCUENTO = Array.from({ length: 21 }, (_, i) => i * 5);

// ─── Helpers internos ─────────────────────────────────────────────────────────

function buildDefaultValues(modo: ModoFormulario, evento?: Evento): CrearEventoInput | ActualizarEventoInput {
  if (modo === 'editar' && evento) {
    return {
      nombre: evento.nombre,
      descripcion: evento.descripcion ?? '',
      requiereEntrada: evento.requiereEntrada,
      estado: evento.estado,
      capacidadMaxima: evento.capacidadMaxima ?? null,
      entradasDisponibles: evento.entradasDisponibles ?? null,
      precio: typeof evento.precio === 'string' ? parseFloat(evento.precio) : (evento.precio ?? 0),
      descuentoSocio: evento.descuentoSocio ?? 0,
      fechaEvento: isoADatetimeLocal(evento.fechaEvento),
      fechaFin: isoADatetimeLocal(evento.fechaFin),
      lugarAcreditacion: evento.lugarAcreditacion,
      inicioVenta: isoADatetimeLocal(evento.inicioVenta),
      finVenta: isoADatetimeLocal(evento.finVenta),
    };
  }
  if (modo === 'crear') {
    return {
      requiereEntrada: true,
      estado: 'PUBLICADO' as const,
      precio: 0,
      descuentoSocio: 0,
      capacidadMaxima: 100,
      entradasDisponibles: 100,
      lugarAcreditacion: 'Club Social y Deportivo',
      nombre: '',
      fechaEvento: '',
    };
  }
  // fallback (no debería ocurrir)
  return { nombre: '', fechaEvento: '', lugarAcreditacion: '' };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function EventoForm({ onSubmit, submitLabel = 'Guardar', onCancel, modo = 'crear', eventoInicial }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const esEdicion = modo === 'editar';
  const entradasVendidas = eventoInicial?.entradasVendidas ?? 0;

  // La imagen del servidor se usa como preview inicial en edición (estado local)
  const imagenBackend = eventoInicial?.imageUrl ?? null;
  const mostrarPreviewBackend =
    esEdicion && !selectedFile && imagenBackend && !imagenBackend.includes('favicon-blanco');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(esEdicion ? actualizarEventoSchema : crearEventoSchema),
    defaultValues: buildDefaultValues(modo, eventoInicial),
  });

  /** Extrae el mensaje de error de un campo de forma type-safe con useForm<any>. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMsg = (field: string): string | undefined => (errors as any)[field]?.message as string | undefined;

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

  async function handleFormSubmit(data: CrearEventoSchema | ActualizarEventoSchema) {
    await (onSubmit as (d: typeof data & { imagenFile?: File | null; tempPreviewUrl?: string | null }) => Promise<void>)({
      ...data,
      imagenFile: selectedFile,
      tempPreviewUrl: previewUrl,
    });
  }

  const puedeDescuento = requiereEntrada && (precio ?? 0) > 0;
  const imagePreviewSrc = previewUrl ?? (mostrarPreviewBackend ? imagenBackend : null);

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
        {imagePreviewSrc ? (
          <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img src={imagePreviewSrc} alt="Vista previa" className="h-32 w-48 object-cover rounded-lg" />
            {/* Solo permitir quitar si es una imagen local elegida; la del backend es de referencia */}
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                title="Quitar imagen local"
                aria-label="Quitar imagen local"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
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
        {getMsg('nombre') && <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('nombre')}</p>}
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
        {getMsg('lugarAcreditacion') && (
          <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('lugarAcreditacion')}</p>
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
        {getMsg('estado') && <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('estado')}</p>}
        {esEdicion && (
          <p className="mt-1 text-xs text-slate-500">
            Atención: el cambio a CANCELADO impide nuevas compras. No es posible volver a PUBLICADO desde CANCELADO o FINALIZADO.
          </p>
        )}
      </div>

      {/* ─── Requiere entrada ─── */}
      <div className="flex items-center gap-3">
        <input
          id="requiereEntrada"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          {...register('requiereEntrada')}
          disabled={esEdicion && entradasVendidas > 0}
        />
        <label htmlFor="requiereEntrada" className="text-sm font-medium text-slate-700 cursor-pointer">
          El evento requiere entradas / tickets
        </label>
      </div>
      {esEdicion && entradasVendidas > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 ring-1 ring-amber-600/20">
          Este evento tiene <strong>{entradasVendidas}</strong> entrada{entradasVendidas !== 1 ? 's' : ''} vendida{entradasVendidas !== 1 ? 's' : ''}.
          La capacidad máxima no puede reducirse por debajo de ese valor y no es posible desactivar la venta de entradas.
        </p>
      )}

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
              min={esEdicion && entradasVendidas > 0 ? entradasVendidas : 1}
              {...register('capacidadMaxima', { valueAsNumber: true })}
              placeholder="100"
            />
            {getMsg('capacidadMaxima') && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('capacidadMaxima')}</p>
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
            {getMsg('entradasDisponibles') && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('entradasDisponibles')}</p>
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
            {getMsg('precio') && <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('precio')}</p>}
            {esEdicion && (
              <p className="mt-1 text-xs text-slate-500">
                El nuevo precio aplica solo a futuras compras; las transacciones anteriores no se modifican.
              </p>
            )}
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
            {getMsg('descuentoSocio') && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('descuentoSocio')}</p>
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
          {getMsg('fechaEvento') && (
            <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('fechaEvento')}</p>
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
          {getMsg('fechaFin') && (
            <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('fechaFin')}</p>
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
            {getMsg('inicioVenta') && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('inicioVenta')}</p>
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
            {getMsg('finVenta') && (
              <p className="mt-1 text-xs text-rose-600" role="alert">{getMsg('finVenta')}</p>
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