import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Info,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Input, Select, ModalActions } from '@/components/ui';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import {
  espacioSchema,
  normalizarEspacioPayload,
  type EspacioFormValues,
} from '../schemas/espacio.schema';
import {
  DIAS_SEMANA,
  MODALIDAD_RESERVA_LABELS,
  TIPO_ESPACIO_LABELS,
  type CreateEspacioPayload,
  type ModalidadReserva,
  type TipoEspacio,
} from '../types';

interface EspacioFormProps {
  onSubmit: (payload: CreateEspacioPayload) => Promise<void>;
  onCancel?: () => void;
  guardando?: boolean;
  submitLabel?: string;
}

const VALORES_INICIALES: EspacioFormValues = {
  nombre: '',
  tipo: 'DEPORTIVO',
  capacidadMaxima: 0,
  modalidad: 'POR_HORA',
  ubicacion: '',
  descripcion: '',
  precio: 0,
  descuentoSocio: 0,
  precioSocio: null,
  montoSena: 0,
  disciplinaIds: [],
  bloqueos: [],
  divisibleEnSubespacios: false,
  modoSubespacios: 'LOTE',
  cantidadSubespacios: 9,
  prefijoSubespacio: '',
  capacidadSubespacio: 10,
  subespacios: [],
};

function construirVistaPreviaLote(prefijoRaw: string | undefined, nombreEspacio: string, cantidad: number | null | undefined): string | null {
  const cant = Number(cantidad);
  if (!Number.isInteger(cant) || cant < 1 || cant > 50) return null;
  const prefijo = prefijoRaw?.trim() || nombreEspacio.trim() || 'Unidad';
  if (cant === 1) {
    return `Se creará: ${prefijo} 1`;
  }
  if (cant === 2) {
    return `Se crearán: ${prefijo} 1, ${prefijo} 2`;
  }
  if (cant === 3) {
    return `Se crearán: ${prefijo} 1, ${prefijo} 2, ${prefijo} 3`;
  }
  return `Se crearán: ${prefijo} 1, ${prefijo} 2 ... ${prefijo} ${cant}`;
}

export function EspacioForm({
  onSubmit,
  onCancel,
  guardando = false,
  submitLabel = 'Crear espacio',
}: EspacioFormProps) {
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [esConflicto409, setEsConflicto409] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EspacioFormValues>({
    resolver: zodResolver(espacioSchema) as any,
    defaultValues: VALORES_INICIALES,
  });

  const {
    fields: bloqueosFields,
    append: agregarBloqueoField,
    remove: quitarBloqueoField,
  } = useFieldArray({
    control,
    name: 'bloqueos',
  });

  const {
    fields: subespaciosFields,
    append: agregarSubespacioField,
    remove: quitarSubespacioField,
  } = useFieldArray({
    control,
    name: 'subespacios',
  });

  const nombreWatch = watch('nombre');
  const tipoSeleccionado = watch('tipo');
  const disciplinaIdsSeleccionadas = watch('disciplinaIds');
  const bloqueosWatch = watch('bloqueos');
  const divisibleWatch = watch('divisibleEnSubespacios');
  const modoSubespaciosWatch = watch('modoSubespacios') ?? 'LOTE';
  const cantidadSubespaciosWatch = watch('cantidadSubespacios');
  const prefijoSubespacioWatch = watch('prefijoSubespacio');
  const precioWatch = watch('precio');
  const descuentoSocioWatch = watch('descuentoSocio');

  const precioNum = Number(precioWatch) || 0;
  const descuentoNum = Number(descuentoSocioWatch) || 0;
  const precioSocioCalculado =
    descuentoNum > 0 ? Math.max(0, Math.round(precioNum * (1 - descuentoNum / 100))) : null;
  const ahorroCalculado =
    descuentoNum > 0 && precioNum > 0 ? Math.round((precioNum * descuentoNum) / 100) : 0;

  const esSocial = tipoSeleccionado === 'SOCIAL';

  // Criterio 2: Si el tipo pasa a SOCIAL, limpiar disciplinas asociadas
  useEffect(() => {
    if (esSocial && disciplinaIdsSeleccionadas.length > 0) {
      setValue('disciplinaIds', [], { shouldValidate: true });
    }
  }, [esSocial, disciplinaIdsSeleccionadas.length, setValue]);

  const toggleDisciplina = (id: number) => {
    const actuales = disciplinaIdsSeleccionadas ?? [];
    if (actuales.includes(id)) {
      setValue(
        'disciplinaIds',
        actuales.filter((item) => item !== id),
        { shouldValidate: true },
      );
    } else {
      setValue('disciplinaIds', [...actuales, id], { shouldValidate: true });
    }
  };

  const toggleDiaSemana = (indexBloqueo: number, dia: number) => {
    const actuales = bloqueosWatch?.[indexBloqueo]?.diasSemana ?? [];
    const nuevos = actuales.includes(dia)
      ? actuales.filter((d) => d !== dia)
      : [...actuales, dia].sort((a, b) => a - b);
    setValue(`bloqueos.${indexBloqueo}.diasSemana`, nuevos, { shouldValidate: true });
  };

  const handleAgregarRecurrente = () => {
    agregarBloqueoField({
      tipo: 'RECURRENTE',
      diasSemana: [],
      horaInicio: '18:00',
      horaFin: '20:00',
      vigenteDesde: '',
      vigenteHasta: '',
      disciplinaId: null,
      motivo: '',
    });
  };

  const handleAgregarPuntual = () => {
    agregarBloqueoField({
      tipo: 'PUNTUAL',
      fecha: '',
      diaCompleto: false,
      horaInicio: '10:00',
      horaFin: '12:00',
      motivo: '',
    });
  };

  const handleAgregarSubespacioPersonalizado = () => {
    const nro = subespaciosFields.length + 1;
    const prefijo = prefijoSubespacioWatch?.trim() || 'Unidad';
    agregarSubespacioField({
      nombre: `${prefijo} ${nro}`,
      capacidadMaxima: 10,
      descripcion: '',
    });
  };

  const procesarSubmit = async (values: EspacioFormValues) => {
    setErrorServidor(null);
    setEsConflicto409(false);
    try {
      const payload = normalizarEspacioPayload(values);
      await onSubmit(payload);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo registrar el espacio físico.';
      setErrorServidor(mensaje);
      setEsConflicto409(status === 409 || /conflicto|reserva|RES-/i.test(mensaje));
    }
  };

  const disciplinasParaBloqueo = disciplinas.filter(
    (d) =>
      disciplinaIdsSeleccionadas.length === 0 || disciplinaIdsSeleccionadas.includes(d.id),
  );

  const vistaPreviaLote = construirVistaPreviaLote(
    prefijoSubespacioWatch,
    nombreWatch,
    cantidadSubespaciosWatch,
  );

  const deshabilitado = guardando || isSubmitting;

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(e) => void handleSubmit(procesarSubmit)(e)}
      noValidate
    >
      {/* Alerta de error o conflicto 409 (Criterio 5) */}
      {errorServidor && (
        <div
          role="alert"
          data-testid="alerta-error-espacio"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            esConflicto409
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <AlertTriangle
            size={18}
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${esConflicto409 ? 'text-amber-600' : 'text-rose-600'}`}
          />
          <div className="space-y-1">
            <p className="font-semibold">
              {esConflicto409
                ? 'Conflicto de agenda con reserva aprobada'
                : 'No se pudo guardar el espacio'}
            </p>
            <p>{errorServidor}</p>
          </div>
        </div>
      )}

      {/* 1. Datos generales del espacio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="nombre"
            label="Nombre del espacio *"
            placeholder="Ej: Sector Parrillas Belgrano 245 / Cancha de Fútbol 5"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
        </div>

        <div>
          <label
            htmlFor="tipo"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Tipo de espacio *
          </label>
          <Select id="tipo" {...register('tipo')}>
            {(Object.keys(TIPO_ESPACIO_LABELS) as TipoEspacio[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_ESPACIO_LABELS[t]}
              </option>
            ))}
          </Select>
          {errors.tipo && (
            <p className="mt-1 text-xs font-medium text-rose-600">{errors.tipo.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="modalidad"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Modalidad de alquiler *
          </label>
          <Select id="modalidad" {...register('modalidad')}>
            {(Object.keys(MODALIDAD_RESERVA_LABELS) as ModalidadReserva[]).map((m) => (
              <option key={m} value={m}>
                {MODALIDAD_RESERVA_LABELS[m]}
              </option>
            ))}
          </Select>
          {errors.modalidad && (
            <p className="mt-1 text-xs font-medium text-rose-600">{errors.modalidad.message}</p>
          )}
        </div>

        <Input
          id="capacidadMaxima"
          label="Capacidad máxima *"
          type="number"
          min={1}
          placeholder="Ej: 20"
          error={errors.capacidadMaxima?.message}
          {...register('capacidadMaxima', {
            setValueAs: (v) => (v === '' || v === null || v === undefined ? NaN : Number(v)),
          })}
        />

        <Input
          id="ubicacion"
          label="Ubicación / Sector"
          placeholder="Ej: Sede Central - Belgrano 245"
          error={errors.ubicacion?.message}
          {...register('ubicacion')}
        />
      </div>

      {/* 2. Valores económicos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          id="precio"
          label="Precio de alquiler ($) *"
          type="number"
          min={1}
          step="any"
          placeholder="Ej: 15000"
          error={errors.precio?.message}
          {...register('precio', {
            setValueAs: (v) => (v === '' || v === null || v === undefined ? NaN : Number(v)),
          })}
        />

        <div>
          <Input
            id="descuentoSocio"
            label="Descuento para socios (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder="0"
            error={errors.descuentoSocio?.message}
            {...register('descuentoSocio', {
              setValueAs: (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
            })}
          />
          <p className="mt-1 text-xs text-slate-500">
            {descuentoNum > 0 && precioNum > 0
              ? `Tarifa final socios: $${precioSocioCalculado?.toLocaleString('es-AR')} (${descuentoNum}% OFF · Ahorro: $${ahorroCalculado.toLocaleString('es-AR')})`
              : '0% = Sin descuento (los socios abonan tarifa general)'}
          </p>
        </div>

        <Input
          id="montoSena"
          label="Seña requerida ($) *"
          type="number"
          min={1}
          step="any"
          placeholder="Ej: 5000"
          error={errors.montoSena?.message}
          {...register('montoSena', {
            setValueAs: (v) => (v === '' || v === null || v === undefined ? NaN : Number(v)),
          })}
        />
      </div>

      {/* Descripción opcional */}
      <div>
        <label
          htmlFor="descripcion"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Descripción
        </label>
        <textarea
          id="descripcion"
          rows={2}
          placeholder="Características, equipamiento o condiciones de uso del espacio..."
          className="w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <p className="mt-1 text-xs font-medium text-rose-600">{errors.descripcion.message}</p>
        )}
      </div>

      {/* 3. Patrón Composite — Sub-espacios / Unidades Múltiples (Opcional) */}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-start gap-3">
          <input
            id="divisibleEnSubespacios"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('divisibleEnSubespacios')}
          />
          <div className="space-y-0.5">
            <label
              htmlFor="divisibleEnSubespacios"
              className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-900"
            >
              <Layers size={15} className="text-brand-600" aria-hidden="true" />
              ¿Este espacio se divide en múltiples unidades o sub-espacios individuales (ej. Canchas, Parrillas, Quinchos)?
            </label>
            <p className="text-xs text-slate-500">
              Permite reservar tanto el complejo completo (para eventos) como cada unidad de forma individual.
            </p>
          </div>
        </div>

        {divisibleWatch && (
          <div
            data-testid="seccion-subespacios-composite"
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
          >
            {/* Selector de modo: Generación rápida en lote vs Personalizado */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setValue('modoSubespacios', 'LOTE', { shouldValidate: true })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  modoSubespaciosWatch === 'LOTE'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Generación rápida en lote
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('modoSubespacios', 'PERSONALIZADO', { shouldValidate: true });
                  if (subespaciosFields.length === 0) {
                    handleAgregarSubespacioPersonalizado();
                  }
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  modoSubespaciosWatch === 'PERSONALIZADO'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Personalizado (lista editable)
              </button>
            </div>

            {modoSubespaciosWatch === 'LOTE' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    id="cantidadSubespacios"
                    label="Cantidad de unidades *"
                    type="number"
                    min={1}
                    max={50}
                    placeholder="Ej: 9"
                    error={errors.cantidadSubespacios?.message}
                    {...register('cantidadSubespacios', {
                      setValueAs: (v) =>
                        v === '' || v === null || v === undefined ? null : Number(v),
                    })}
                  />
                  <Input
                    id="prefijoSubespacio"
                    label="Prefijo de cada unidad"
                    placeholder="Ej: Parrilla / Cancha"
                    error={errors.prefijoSubespacio?.message}
                    {...register('prefijoSubespacio')}
                  />
                  <Input
                    id="capacidadSubespacio"
                    label="Capacidad por unidad"
                    type="number"
                    min={1}
                    placeholder="Ej: 10"
                    error={errors.capacidadSubespacio?.message}
                    {...register('capacidadSubespacio', {
                      setValueAs: (v) =>
                        v === '' || v === null || v === undefined ? null : Number(v),
                    })}
                  />
                </div>

                {vistaPreviaLote && (
                  <div
                    data-testid="vista-previa-subespacios"
                    className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs font-medium text-brand-800"
                  >
                    <Info size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                    <span>{vistaPreviaLote}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Unidades individuales ({subespaciosFields.length})
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAgregarSubespacioPersonalizado}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Agregar sub-espacio
                  </Button>
                </div>

                {subespaciosFields.map((subField, idx) => {
                  const errSub = errors.subespacios?.[idx];
                  return (
                    <div
                      key={subField.id}
                      data-testid={`subespacio-item-${idx}`}
                      className="grid grid-cols-1 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-5">
                        <Input
                          id={`subespacios.${idx}.nombre`}
                          label="Nombre de la unidad *"
                          placeholder="Ej: Parrilla 1"
                          error={errSub?.nombre?.message}
                          {...register(`subespacios.${idx}.nombre`)}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          id={`subespacios.${idx}.capacidadMaxima`}
                          label="Capacidad *"
                          type="number"
                          min={1}
                          error={errSub?.capacidadMaxima?.message}
                          {...register(`subespacios.${idx}.capacidadMaxima`, {
                            setValueAs: (v) =>
                              v === '' || v === null || v === undefined ? NaN : Number(v),
                          })}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          id={`subespacios.${idx}.descripcion`}
                          label="Detalle"
                          placeholder="Opcional"
                          error={errSub?.descripcion?.message}
                          {...register(`subespacios.${idx}.descripcion`)}
                        />
                      </div>
                      <div className="flex justify-end pt-6 sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Quitar sub-espacio ${idx + 1}`}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => quitarSubespacioField(idx)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* 4. Disciplinas compatibles (Criterio 2: solo para DEPORTIVO o MULTIUSO; aviso si es SOCIAL) */}
      {esSocial ? (
        <div
          data-testid="aviso-social-sin-disciplinas"
          className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
          <span>
            Los espacios de tipo <strong>Social</strong> no permiten asociar disciplinas deportivas. Si tenía disciplinas seleccionadas, fueron limpiadas automáticamente.
          </span>
        </div>
      ) : (
        <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
            Disciplinas compatibles
          </legend>
          <p className="text-xs text-slate-500">
            Seleccioná las disciplinas deportivas que pueden practicar o entrenar en este espacio.
          </p>

          {cargandoDisciplinas ? (
            <p className="text-xs text-slate-500">Cargando disciplinas…</p>
          ) : disciplinas.length === 0 ? (
            <p className="text-xs text-slate-500">No hay disciplinas activas registradas.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {disciplinas.map((disciplina) => {
                const seleccionada = disciplinaIdsSeleccionadas.includes(disciplina.id);
                return (
                  <label
                    key={disciplina.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      seleccionada
                        ? 'border-brand-300 bg-brand-50/70 font-medium text-brand-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionada}
                      onChange={() => toggleDisciplina(disciplina.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{disciplina.nombre}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {/* 5. Bloqueos de agenda iniciales (Criterios 3 y 4) */}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Bloqueos de agenda iniciales</h3>
            <p className="text-xs text-slate-500">
              Reservá horarios fijos de entrenamiento (recurrentes) o fechas por eventos/mantenimiento (puntuales).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAgregarRecurrente}
            >
              <CalendarClock size={14} aria-hidden="true" />
              Agregar bloqueo recurrente
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAgregarPuntual}
            >
              <CalendarDays size={14} aria-hidden="true" />
              Agregar bloqueo puntual
            </Button>
          </div>
        </div>

        {bloqueosFields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Sin bloqueos iniciales configurados. Podés agregarlos ahora o más adelante.
          </p>
        ) : (
          <div className="space-y-4">
            {bloqueosFields.map((field, index) => {
              const bActual = bloqueosWatch?.[index];
              const esRecurrente = (bActual?.tipo ?? field.tipo) === 'RECURRENTE';
              const esDiaCompleto = Boolean(bActual?.diaCompleto);
              const errBloqueo = errors.bloqueos?.[index];

              return (
                <div
                  key={field.id}
                  data-testid={`bloqueo-item-${index}`}
                  className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                      {esRecurrente ? (
                        <>
                          <CalendarClock size={14} aria-hidden="true" />
                          Bloqueo recurrente #{index + 1}
                        </>
                      ) : (
                        <>
                          <CalendarDays size={14} aria-hidden="true" />
                          Bloqueo puntual / evento #{index + 1}
                        </>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar bloqueo ${index + 1}`}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => quitarBloqueoField(index)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Quitar
                    </Button>
                  </div>

                  {esRecurrente ? (
                    <div className="space-y-4">
                      {/* Días de la semana */}
                      <div>
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Días de la semana *
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {DIAS_SEMANA.map((d) => {
                            const activo = (bActual?.diasSemana ?? []).includes(d.valor);
                            return (
                              <button
                                key={d.valor}
                                type="button"
                                aria-pressed={activo}
                                onClick={() => toggleDiaSemana(index, d.valor)}
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                  activo
                                    ? 'border-brand-600 bg-brand-600 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {d.nombre}
                              </button>
                            );
                          })}
                        </div>
                        {errBloqueo?.diasSemana && (
                          <p className="mt-1 text-xs font-medium text-rose-600">
                            {errBloqueo.diasSemana.message}
                          </p>
                        )}
                      </div>

                      {/* Franja horaria y vigencia */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input
                          id={`bloqueos.${index}.horaInicio`}
                          label="Hora de inicio *"
                          type="time"
                          error={errBloqueo?.horaInicio?.message}
                          {...register(`bloqueos.${index}.horaInicio`)}
                        />
                        <Input
                          id={`bloqueos.${index}.horaFin`}
                          label="Hora de fin *"
                          type="time"
                          error={errBloqueo?.horaFin?.message}
                          {...register(`bloqueos.${index}.horaFin`)}
                        />
                        <Input
                          id={`bloqueos.${index}.vigenteHasta`}
                          label="Vigencia hasta *"
                          type="date"
                          error={errBloqueo?.vigenteHasta?.message}
                          {...register(`bloqueos.${index}.vigenteHasta`)}
                        />
                      </div>

                      {/* Disciplina asociada y motivo */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {!esSocial && (
                          <div>
                            <label
                              htmlFor={`bloqueos.${index}.disciplinaId`}
                              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
                            >
                              Disciplina asociada
                            </label>
                            <Controller
                              control={control}
                              name={`bloqueos.${index}.disciplinaId`}
                              render={({ field: discField }) => (
                                <Select
                                  id={`bloqueos.${index}.disciplinaId`}
                                  value={discField.value ?? ''}
                                  onChange={(e) =>
                                    discField.onChange(
                                      e.target.value ? Number(e.target.value) : null,
                                    )
                                  }
                                >
                                  <option value="">Sin disciplina específica</option>
                                  {disciplinasParaBloqueo.map((disc) => (
                                    <option key={disc.id} value={disc.id}>
                                      {disc.nombre}
                                    </option>
                                  ))}
                                </Select>
                              )}
                            />
                          </div>
                        )}
                        <Input
                          id={`bloqueos.${index}.motivo`}
                          label="Motivo / Detalle"
                          placeholder="Ej: Entrenamiento Primera División"
                          error={errBloqueo?.motivo?.message}
                          {...register(`bloqueos.${index}.motivo`)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          id={`bloqueos.${index}.fecha`}
                          label="Fecha específica *"
                          type="date"
                          error={errBloqueo?.fecha?.message}
                          {...register(`bloqueos.${index}.fecha`)}
                        />

                        <Input
                          id={`bloqueos.${index}.motivo`}
                          label="Motivo del bloqueo *"
                          placeholder="Ej: Torneo regional / Mantenimiento"
                          error={errBloqueo?.motivo?.message}
                          {...register(`bloqueos.${index}.motivo`)}
                        />
                      </div>

                      <div className="flex items-center gap-2.5">
                        <input
                          id={`bloqueos.${index}.diaCompleto`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          {...register(`bloqueos.${index}.diaCompleto`)}
                        />
                        <label
                          htmlFor={`bloqueos.${index}.diaCompleto`}
                          className="cursor-pointer text-sm font-medium text-slate-700"
                        >
                          Día completo (toda la jornada)
                        </label>
                      </div>

                      {!esDiaCompleto && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            id={`bloqueos.${index}.horaInicio`}
                            label="Hora de inicio *"
                            type="time"
                            error={errBloqueo?.horaInicio?.message}
                            {...register(`bloqueos.${index}.horaInicio`)}
                          />
                          <Input
                            id={`bloqueos.${index}.horaFin`}
                            label="Hora de fin *"
                            type="time"
                            error={errBloqueo?.horaFin?.message}
                            {...register(`bloqueos.${index}.horaFin`)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </fieldset>

      <ModalActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={deshabilitado}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={deshabilitado}>
          <Plus size={16} aria-hidden="true" />
          {deshabilitado ? 'Guardando…' : submitLabel}
        </Button>
      </ModalActions>
    </form>
  );
}
