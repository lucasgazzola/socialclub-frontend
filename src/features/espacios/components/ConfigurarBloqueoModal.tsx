import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CalendarClock, CalendarDays } from 'lucide-react';
import { Button, Input, Modal, ModalActions, Select } from '@/components/ui';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import {
  bloqueoFormSchema,
  normalizarBloqueoPayload,
  type BloqueoFormValues,
} from '../schemas/espacio.schema';
import { DIAS_SEMANA, type CreateBloqueoPayload, type Espacio } from '../types';

interface ConfigurarBloqueoModalProps {
  espacio: Espacio | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (espacioId: number, payload: CreateBloqueoPayload) => Promise<void>;
  guardando?: boolean;
}

const VALORES_INICIALES_BLOQUEO: BloqueoFormValues = {
  tipo: 'RECURRENTE',
  diasSemana: [],
  fecha: '',
  diaCompleto: false,
  horaInicio: '18:00',
  horaFin: '20:00',
  vigenteDesde: '',
  vigenteHasta: '',
  disciplinaId: null,
  motivo: '',
};

export function ConfigurarBloqueoModal({
  espacio,
  open,
  onClose,
  onSubmit,
  guardando = false,
}: ConfigurarBloqueoModalProps) {
  const { disciplinas } = useDisciplinasActivas();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [esConflicto409, setEsConflicto409] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BloqueoFormValues>({
    resolver: zodResolver(bloqueoFormSchema),
    defaultValues: VALORES_INICIALES_BLOQUEO,
  });

  const tipo = watch('tipo');
  const diasSemana = watch('diasSemana') ?? [];
  const diaCompleto = Boolean(watch('diaCompleto'));

  const toggleDia = (dia: number) => {
    const nuevos = diasSemana.includes(dia)
      ? diasSemana.filter((d) => d !== dia)
      : [...diasSemana, dia].sort((a, b) => a - b);
    setValue('diasSemana', nuevos, { shouldValidate: true });
  };

  const handleClose = () => {
    if (guardando || isSubmitting) return;
    setErrorServidor(null);
    setEsConflicto409(false);
    reset(VALORES_INICIALES_BLOQUEO);
    onClose();
  };

  const procesarSubmit = async (values: BloqueoFormValues) => {
    if (!espacio) return;
    setErrorServidor(null);
    setEsConflicto409(false);
    try {
      const payload = normalizarBloqueoPayload(values);
      await onSubmit(espacio.id, payload);
      reset(VALORES_INICIALES_BLOQUEO);
      onClose();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo configurar el bloqueo de agenda.';
      setErrorServidor(mensaje);
      setEsConflicto409(status === 409 || /conflicto|reserva|RES-/i.test(mensaje));
    }
  };

  const esSocial = espacio?.tipo === 'SOCIAL';
  const idsCompatibles = espacio?.disciplinas?.map((d) => d.disciplina.id) ?? [];
  const disciplinasDisponibles =
    idsCompatibles.length > 0
      ? disciplinas.filter((d) => idsCompatibles.includes(d.id))
      : disciplinas;

  const deshabilitado = guardando || isSubmitting;

  return (
    <Modal
      open={open && espacio !== null}
      title={espacio ? `Configurar bloqueo · ${espacio.nombre}` : 'Configurar bloqueo'}
      description="Registrá un bloqueo recurrente de entrenamiento o un bloqueo puntual por evento/mantenimiento."
      onClose={handleClose}
      icon={<CalendarClock />}
      size="lg"
    >
      <form
        className="max-w-2xl space-y-5"
        onSubmit={(e) => void handleSubmit(procesarSubmit)(e)}
        noValidate
      >
        {errorServidor && (
          <div
            role="alert"
            data-testid="alerta-conflicto-bloqueo"
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
                  ? 'Conflicto con reserva aprobada'
                  : 'No se pudo registrar el bloqueo'}
              </p>
              <p>{errorServidor}</p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="tipo-bloqueo-modal"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Tipo de bloqueo *
          </label>
          <Select id="tipo-bloqueo-modal" {...register('tipo')}>
            <option value="RECURRENTE">Recurrente (entrenamiento semanal)</option>
            <option value="PUNTUAL">Puntual (evento o mantenimiento en fecha fija)</option>
          </Select>
        </div>

        {tipo === 'RECURRENTE' ? (
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Días de la semana *
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((d) => {
                  const activo = diasSemana.includes(d.valor);
                  return (
                    <button
                      key={d.valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => toggleDia(d.valor)}
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
              {errors.diasSemana && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {errors.diasSemana.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                id="modal-horaInicio"
                label="Hora de inicio *"
                type="time"
                error={errors.horaInicio?.message}
                {...register('horaInicio')}
              />
              <Input
                id="modal-horaFin"
                label="Hora de fin *"
                type="time"
                error={errors.horaFin?.message}
                {...register('horaFin')}
              />
              <Input
                id="modal-vigenteHasta"
                label="Vigencia hasta *"
                type="date"
                error={errors.vigenteHasta?.message}
                {...register('vigenteHasta')}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!esSocial && (
                <div>
                  <label
                    htmlFor="modal-disciplinaId"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Disciplina asociada
                  </label>
                  <Controller
                    control={control}
                    name="disciplinaId"
                    render={({ field }) => (
                      <Select
                        id="modal-disciplinaId"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="">Sin disciplina específica</option>
                        {disciplinasDisponibles.map((disc) => (
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
                id="modal-motivo-rec"
                label="Motivo / Detalle"
                placeholder="Ej: Entrenamiento Juveniles"
                error={errors.motivo?.message}
                {...register('motivo')}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                id="modal-fecha"
                label="Fecha específica *"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />
              <Input
                id="modal-motivo-puntual"
                label="Motivo del bloqueo *"
                placeholder="Ej: Torneo regional / Mantenimiento"
                error={errors.motivo?.message}
                {...register('motivo')}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                id="modal-diaCompleto"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...register('diaCompleto')}
              />
              <label
                htmlFor="modal-diaCompleto"
                className="cursor-pointer text-sm font-medium text-slate-700"
              >
                Día completo (toda la jornada)
              </label>
            </div>

            {!diaCompleto && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  id="modal-puntual-horaInicio"
                  label="Hora de inicio *"
                  type="time"
                  error={errors.horaInicio?.message}
                  {...register('horaInicio')}
                />
                <Input
                  id="modal-puntual-horaFin"
                  label="Hora de fin *"
                  type="time"
                  error={errors.horaFin?.message}
                  {...register('horaFin')}
                />
              </div>
            )}
          </div>
        )}

        <ModalActions>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={deshabilitado}>
            Cancelar
          </Button>
          <Button type="submit" disabled={deshabilitado}>
            <CalendarDays size={16} aria-hidden="true" />
            {deshabilitado ? 'Guardando…' : 'Guardar bloqueo'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
