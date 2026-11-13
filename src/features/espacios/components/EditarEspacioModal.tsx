import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Info,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Badge, Button, Input, Modal, Select } from '@/components/ui';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import {
  DIAS_SEMANA,
  MODALIDAD_RESERVA_LABELS,
  TIPO_ESPACIO_LABELS,
  type BloqueoAgenda,
  type CreateBloqueoPayload,
  type Espacio,
  type ModalidadReserva,
  type TipoEspacio,
  type UpdateBloqueoPayload,
  type UpdateEspacioPayload,
} from '../types';
import {
  useActualizarBloqueo,
  useActualizarEspacio,
  useAgregarBloqueo,
  useEliminarBloqueo,
  useEspacio,
} from '../hooks/useEspacios';

const espacioEditSchema = z
  .object({
    nombre: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(120, 'Máximo 120 caracteres'),
    tipo: z.enum(['DEPORTIVO', 'SOCIAL', 'MULTIUSO']),
    capacidadMaxima: z.number().int().min(1, 'La capacidad debe ser de al menos 1 persona'),
    modalidad: z.enum(['POR_HORA', 'DIA_COMPLETO']),
    ubicacion: z.string().max(200, 'Máximo 200 caracteres').optional(),
    descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
    precio: z.number().min(1, 'El precio debe ser mayor a 0'),
    precioSocio: z.number().min(0).optional().nullable(),
    montoSena: z.number().min(0, 'La seña no puede ser negativa'),
    disciplinaIds: z.array(z.number()),
  })
  .refine((data) => data.montoSena <= data.precio, {
    message: 'El monto de la seña no puede superar el precio de alquiler',
    path: ['montoSena'],
  });

type EspacioEditFormValues = z.infer<typeof espacioEditSchema>;

interface EditarEspacioModalProps {
  espacio: Espacio | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditarEspacioModal({
  espacio,
  open,
  onClose,
  onSuccess,
}: EditarEspacioModalProps) {
  const [tabActiva, setTabActiva] = useState<'datos' | 'bloqueos'>('datos');
  const [errorConflictoBloqueo, setErrorConflictoBloqueo] = useState<string | null>(null);

  // Sub-formulario para agregar o editar un bloqueo
  const [bloqueoEnEdicion, setBloqueoEnEdicion] = useState<BloqueoAgenda | null>(null);
  const [mostrandoFormBloqueo, setMostrandoFormBloqueo] = useState(false);

  // Campos del formulario de bloqueo
  const [bloqTipo, setBloqTipo] = useState<'RECURRENTE' | 'PUNTUAL'>('RECURRENTE');
  const [bloqDias, setBloqDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bloqFecha, setBloqFecha] = useState('');
  const [bloqHoraInicio, setBloqHoraInicio] = useState('18:00');
  const [bloqHoraFin, setBloqHoraFin] = useState('20:00');
  const [bloqVigenteDesde, setBloqVigenteDesde] = useState('');
  const [bloqVigenteHasta, setBloqVigenteHasta] = useState('');
  const [bloqDisciplinaId, setBloqDisciplinaId] = useState<number | ''>('');
  const [bloqMotivo, setBloqMotivo] = useState('');

  // Traer detalle fresco del espacio (incluye bloqueos vigentes)
  const { data: espacioDetalle } = useEspacio(espacio?.id ?? null);
  const espacioActual = espacioDetalle ?? espacio;

  const { disciplinas: disciplinasClub } = useDisciplinasActivas();

  const actualizarEspacio = useActualizarEspacio();
  const agregarBloqueo = useAgregarBloqueo();
  const actualizarBloqueo = useActualizarBloqueo();
  const eliminarBloqueo = useEliminarBloqueo();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EspacioEditFormValues>({
    resolver: zodResolver(espacioEditSchema),
    defaultValues: {
      nombre: '',
      tipo: 'DEPORTIVO',
      capacidadMaxima: 10,
      modalidad: 'POR_HORA',
      ubicacion: '',
      descripcion: '',
      precio: 1000,
      precioSocio: null,
      montoSena: 0,
      disciplinaIds: [],
    },
  });

  const tipoActual = watch('tipo');
  const disciplinaIdsActual = watch('disciplinaIds') ?? [];

  useEffect(() => {
    if (espacioActual && open) {
      const discIds =
        espacioActual.disciplinas?.map((d) => d.disciplina.id) ?? [];
      reset({
        nombre: espacioActual.nombre,
        tipo: espacioActual.tipo,
        capacidadMaxima: espacioActual.capacidadMaxima,
        modalidad: espacioActual.modalidad,
        ubicacion: espacioActual.ubicacion ?? '',
        descripcion: espacioActual.descripcion ?? '',
        precio: Number(espacioActual.precio),
        precioSocio: espacioActual.precioSocio ? Number(espacioActual.precioSocio) : null,
        montoSena: Number(espacioActual.montoSena),
        disciplinaIds: espacioActual.tipo === 'SOCIAL' ? [] : discIds,
      });
      setErrorConflictoBloqueo(null);
      setMostrandoFormBloqueo(false);
      setBloqueoEnEdicion(null);
    }
  }, [espacioActual, open, reset]);

  // Si se cambia a SOCIAL, limpiar disciplinas
  useEffect(() => {
    if (tipoActual === 'SOCIAL' && disciplinaIdsActual.length > 0) {
      setValue('disciplinaIds', []);
    }
  }, [tipoActual, disciplinaIdsActual.length, setValue]);

  if (!espacioActual) return null;

  const bloqueosVigentes = espacioActual.bloqueos ?? [];

  const handleGuardarDatos = async (values: EspacioEditFormValues) => {
    try {
      const payload: UpdateEspacioPayload = {
        nombre: values.nombre.trim(),
        tipo: values.tipo,
        capacidadMaxima: values.capacidadMaxima,
        modalidad: values.modalidad,
        ubicacion: values.ubicacion?.trim() || undefined,
        descripcion: values.descripcion?.trim() || undefined,
        precio: values.precio,
        precioSocio: values.precioSocio ? values.precioSocio : undefined,
        montoSena: values.montoSena,
        disciplinaIds: values.tipo === 'SOCIAL' ? [] : values.disciplinaIds,
      };

      await actualizarEspacio.mutateAsync({ id: espacioActual.id, payload });
      onSuccess?.();
      onClose();
    } catch {
      // Notificado por el hook
    }
  };

  const handleAbrirNuevoBloqueo = () => {
    setBloqueoEnEdicion(null);
    setBloqTipo('RECURRENTE');
    setBloqDias([1, 2, 3, 4, 5]);
    setBloqFecha('');
    setBloqHoraInicio('18:00');
    setBloqHoraFin('20:00');
    setBloqVigenteDesde('');
    setBloqVigenteHasta('');
    setBloqDisciplinaId('');
    setBloqMotivo('');
    setErrorConflictoBloqueo(null);
    setMostrandoFormBloqueo(true);
  };

  const handleAbrirEditarBloqueo = (b: BloqueoAgenda) => {
    setBloqueoEnEdicion(b);
    setBloqTipo(b.tipo);
    setBloqDias(b.diasSemana ?? []);
    setBloqFecha(b.fecha ? b.fecha.split('T')[0] : '');
    setBloqHoraInicio(b.horaInicio ?? '18:00');
    setBloqHoraFin(b.horaFin ?? '20:00');
    setBloqVigenteDesde(b.vigenteDesde ? b.vigenteDesde.split('T')[0] : '');
    setBloqVigenteHasta(b.vigenteHasta ? b.vigenteHasta.split('T')[0] : '');
    setBloqDisciplinaId(b.disciplinaId ?? '');
    setBloqMotivo(b.motivo ?? '');
    setErrorConflictoBloqueo(null);
    setMostrandoFormBloqueo(true);
  };

  const handleGuardarBloqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorConflictoBloqueo(null);

    try {
      if (bloqueoEnEdicion) {
        const payload: UpdateBloqueoPayload = {
          tipo: bloqTipo,
          diasSemana: bloqTipo === 'RECURRENTE' ? bloqDias : [],
          fecha: bloqTipo === 'PUNTUAL' && bloqFecha ? bloqFecha : undefined,
          horaInicio: bloqHoraInicio,
          horaFin: bloqHoraFin,
          vigenteDesde: bloqVigenteDesde || undefined,
          vigenteHasta: bloqVigenteHasta || undefined,
          disciplinaId: bloqDisciplinaId !== '' ? Number(bloqDisciplinaId) : undefined,
          motivo: bloqMotivo.trim() || undefined,
        };

        await actualizarBloqueo.mutateAsync({
          espacioId: espacioActual.id,
          bloqueoId: bloqueoEnEdicion.id,
          payload,
        });
      } else {
        const payload: CreateBloqueoPayload = {
          tipo: bloqTipo,
          diasSemana: bloqTipo === 'RECURRENTE' ? bloqDias : [],
          fecha: bloqTipo === 'PUNTUAL' && bloqFecha ? bloqFecha : undefined,
          horaInicio: bloqHoraInicio,
          horaFin: bloqHoraFin,
          vigenteDesde: bloqVigenteDesde || undefined,
          vigenteHasta: bloqVigenteHasta || undefined,
          disciplinaId: bloqDisciplinaId !== '' ? Number(bloqDisciplinaId) : undefined,
          motivo: bloqMotivo.trim() || undefined,
        };

        await agregarBloqueo.mutateAsync({
          espacioId: espacioActual.id,
          payload,
        });
      }

      setMostrandoFormBloqueo(false);
      setBloqueoEnEdicion(null);
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        message?: string;
        response?: { status?: number; data?: { message?: string } };
      };
      if (errorObj?.status === 409 || errorObj?.response?.status === 409) {
        const msj =
          errorObj?.response?.data?.message ||
          errorObj?.message ||
          'El bloqueo entra en conflicto con una reserva aprobada.';
        setErrorConflictoBloqueo(msj);
      }
    }
  };

  const handleEliminarBloqueo = async (bloqueoId: number) => {
    if (window.confirm('¿Confirmás dar de baja este bloqueo de agenda?')) {
      try {
        await eliminarBloqueo.mutateAsync({
          espacioId: espacioActual.id,
          bloqueoId,
        });
      } catch {
        // Notificado por hook
      }
    }
  };

  return (
    <Modal
      open={open}
      title={`Editar espacio físico · ${espacioActual.nombre}`}
      description="Modificá las características, tarifas diferenciadas, disciplinas y gestioná los bloqueos de agenda."
      onClose={onClose}
      icon={<Building2 />}
      size="lg"
    >
      <div className="space-y-5">
        {/* Pestañas de Edición */}
        <div className="border-b border-slate-200">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTabActiva('datos')}
              className={`inline-flex items-center gap-2 border-b-2 py-2.5 text-sm font-semibold transition-colors ${
                tabActiva === 'datos'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Building2 size={16} aria-hidden="true" />
              <span>Datos del espacio</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('bloqueos')}
              className={`inline-flex items-center gap-2 border-b-2 py-2.5 text-sm font-semibold transition-colors ${
                tabActiva === 'bloqueos'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <CalendarClock size={16} aria-hidden="true" />
              <span>Bloqueos de agenda</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {bloqueosVigentes.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Datos Generales */}
        {tabActiva === 'datos' && (
          <form onSubmit={handleSubmit(handleGuardarDatos)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-nombre" className="block text-xs font-semibold text-slate-700">
                  Nombre del espacio *
                </label>
                <Input
                  id="edit-nombre"
                  {...register('nombre')}
                  className="mt-1"
                  placeholder="Ej: Salón de Eventos Principal"
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-rose-600">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-tipo" className="block text-xs font-semibold text-slate-700">
                  Tipo de espacio *
                </label>
                <Select id="edit-tipo" {...register('tipo')} className="mt-1">
                  {(Object.keys(TIPO_ESPACIO_LABELS) as TipoEspacio[]).map((t) => (
                    <option key={t} value={t}>
                      {TIPO_ESPACIO_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="edit-capacidad"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Capacidad máxima (personas) *
                </label>
                <Input
                  id="edit-capacidad"
                  type="number"
                  {...register('capacidadMaxima', { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.capacidadMaxima && (
                  <p className="mt-1 text-xs text-rose-600">{errors.capacidadMaxima.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-modalidad"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Modalidad de alquiler *
                </label>
                <Select id="edit-modalidad" {...register('modalidad')} className="mt-1">
                  {(Object.keys(MODALIDAD_RESERVA_LABELS) as ModalidadReserva[]).map((m) => (
                    <option key={m} value={m}>
                      {MODALIDAD_RESERVA_LABELS[m]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="edit-ubicacion"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Ubicación física
                </label>
                <Input
                  id="edit-ubicacion"
                  {...register('ubicacion')}
                  placeholder="Ej: Sede Central - Belgrano 245"
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-descripcion"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Descripción o comodidades
                </label>
                <textarea
                  id="edit-descripcion"
                  rows={2}
                  {...register('descripcion')}
                  placeholder="Iluminación LED, aire acondicionado, parrilla, vestuarios..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              {/* Tarifas */}
              <div>
                <label htmlFor="edit-precio" className="block text-xs font-semibold text-slate-700">
                  Tarifa general / No socio ($) *
                </label>
                <Input
                  id="edit-precio"
                  type="number"
                  {...register('precio', { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.precio && (
                  <p className="mt-1 text-xs text-rose-600">{errors.precio.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-precioSocio"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Tarifa preferencial para socios ($)
                </label>
                <Input
                  id="edit-precioSocio"
                  type="number"
                  {...register('precioSocio', {
                    setValueAs: (v) => (v === '' ? null : Number(v)),
                  })}
                  placeholder="Dejar vacío si es igual a no socio"
                  className="mt-1"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-montoSena"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Seña obligatoria de reserva ($) *
                </label>
                <Input
                  id="edit-montoSena"
                  type="number"
                  {...register('montoSena', { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.montoSena && (
                  <p className="mt-1 text-xs text-rose-600">{errors.montoSena.message}</p>
                )}
              </div>
            </div>

            {/* Disciplinas Compatibles */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-700">
                Disciplinas deportivas compatibles
              </label>

              {tipoActual === 'SOCIAL' ? (
                <div
                  data-testid="aviso-disciplinas-social"
                  className="mt-2 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900"
                >
                  <Info size={16} className="text-blue-600 shrink-0" aria-hidden="true" />
                  <span>
                    Los espacios de tipo <strong>SOCIAL</strong> no admiten asignación de
                    disciplinas deportivas (exclusivo para reuniones, quinchos o salones de eventos).
                  </span>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {disciplinasClub.map((disc) => {
                    const seleccionada = disciplinaIdsActual.includes(disc.id);
                    return (
                      <label
                        key={disc.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                          seleccionada
                            ? 'border-brand-300 bg-brand-50 text-brand-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('disciplinaIds', [...disciplinaIdsActual, disc.id]);
                            } else {
                              setValue(
                                'disciplinaIds',
                                disciplinaIdsActual.filter((id) => id !== disc.id),
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-brand-600"
                        />
                        <span className="font-medium">{disc.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizarEspacio.isPending}>
                <Save size={15} aria-hidden="true" />
                {actualizarEspacio.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Bloqueos de Agenda */}
        {tabActiva === 'bloqueos' && (
          <div className="space-y-4">
            {errorConflictoBloqueo && (
              <div
                role="alert"
                data-testid="alerta-conflicto-bloqueo"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900"
              >
                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Conflicto con reserva aprobada:</strong>
                  <p className="mt-0.5">{errorConflictoBloqueo}</p>
                </div>
              </div>
            )}

            {!mostrandoFormBloqueo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Bloqueos de agenda vigentes
                    </h4>
                    <p className="text-xs text-slate-500">
                      Horarios reservados para entrenamientos de disciplinas, mantenimiento o eventos.
                    </p>
                  </div>
                  <Button size="sm" onClick={handleAbrirNuevoBloqueo}>
                    <Plus size={14} aria-hidden="true" />
                    Nuevo bloqueo
                  </Button>
                </div>

                {bloqueosVigentes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                    <CalendarClock className="mx-auto mb-2 text-slate-300" size={28} />
                    Este espacio no tiene bloqueos de agenda vigentes.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                    {bloqueosVigentes.map((b) => {
                      const diasTexto =
                        b.diasSemana && b.diasSemana.length > 0
                          ? b.diasSemana
                              .map((d) => DIAS_SEMANA.find((dia) => dia.valor === d)?.etiqueta)
                              .filter(Boolean)
                              .join(', ')
                          : null;

                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={b.tipo === 'RECURRENTE' ? 'default' : 'secondary'}>
                                {b.tipo}
                              </Badge>
                              {b.disciplina && (
                                <Badge variant="outline" className="font-medium">
                                  {b.disciplina.nombre}
                                </Badge>
                              )}
                              <span className="text-xs font-semibold text-slate-800">
                                {b.horaInicio ?? '—'} - {b.horaFin ?? '—'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500">
                              {b.tipo === 'RECURRENTE' && diasTexto && (
                                <span>Días: {diasTexto} · </span>
                              )}
                              {b.tipo === 'PUNTUAL' && b.fecha && (
                                <span>Fecha: {b.fecha.split('T')[0]} · </span>
                              )}
                              {b.motivo && <span className="italic">{b.motivo}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAbrirEditarBloqueo(b)}
                              title="Editar bloqueo"
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => handleEliminarBloqueo(b.id)}
                              title="Eliminar bloqueo"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Sub-formulario de Creación / Edición de Bloqueo */
              <form
                onSubmit={handleGuardarBloqueo}
                className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50/75 p-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-slate-900">
                    {bloqueoEnEdicion ? 'Modificar bloqueo de agenda' : 'Nuevo bloqueo de agenda'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMostrandoFormBloqueo(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium text-slate-700">Tipo de bloqueo</label>
                    <Select
                      value={bloqTipo}
                      onChange={(e) => setBloqTipo(e.target.value as 'RECURRENTE' | 'PUNTUAL')}
                      className="mt-1"
                    >
                      <option value="RECURRENTE">Recurrente semanal</option>
                      <option value="PUNTUAL">Puntual (fecha específica)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700">Disciplina asociada</label>
                    <Select
                      value={bloqDisciplinaId}
                      onChange={(e) =>
                        setBloqDisciplinaId(e.target.value ? Number(e.target.value) : '')
                      }
                      className="mt-1"
                    >
                      <option value="">Ninguna / Mantenimiento general</option>
                      {disciplinasClub.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {bloqTipo === 'RECURRENTE' ? (
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700">
                        Días de la semana aplicables
                      </label>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {DIAS_SEMANA.map((dia) => {
                          const activo = bloqDias.includes(dia.valor);
                          return (
                            <button
                              key={dia.valor}
                              type="button"
                              onClick={() => {
                                if (activo) {
                                  setBloqDias(bloqDias.filter((v) => v !== dia.valor));
                                } else {
                                  setBloqDias([...bloqDias, dia.valor]);
                                }
                              }}
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                                activo
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {dia.etiqueta}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-medium text-slate-700">Fecha específica</label>
                      <Input
                        type="date"
                        value={bloqFecha}
                        onChange={(e) => setBloqFecha(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-slate-700">Hora de inicio</label>
                    <Input
                      type="time"
                      value={bloqHoraInicio}
                      onChange={(e) => setBloqHoraInicio(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700">Hora de fin</label>
                    <Input
                      type="time"
                      value={bloqHoraFin}
                      onChange={(e) => setBloqHoraFin(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700">Motivo del bloqueo</label>
                    <Input
                      value={bloqMotivo}
                      onChange={(e) => setBloqMotivo(e.target.value)}
                      placeholder="Ej: Entrenamiento categoría sub-16"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMostrandoFormBloqueo(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={actualizarBloqueo.isPending || agregarBloqueo.isPending}
                  >
                    <Save size={13} aria-hidden="true" />
                    {bloqueoEnEdicion ? 'Actualizar bloqueo' : 'Crear bloqueo'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
