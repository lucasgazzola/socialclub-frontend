import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileText, UserCheck } from 'lucide-react';
import { Button, DateInput, Input, Select, Spinner } from '@/components/ui';
import { isoADisplay } from '@/lib/utils/fecha';
import {
  GENERO_DISCIPLINA_LABELS,
  categoriasDisponibles,
  describirAniosNacimiento,
  describirEdad,
  etiquetaPlazo,
  type GeneroDisciplina,
} from '../../disciplinas/types';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge } from '../../documentacion/components/EstadoBadges';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { obtenerRequisitos } from '../api/inscripcion.api';
import { useBuscarParticipante } from '../hooks/useBuscarParticipante';
import { useCrearInscripcion } from '../hooks/useCrearInscripcion';
import { DisciplinaCategoriaSelector } from './disciplinaCategoriaSelector';
import type { CrearInscripcionPayload, InscripcionCreada, ParticipanteEncontrado } from '../types';

const DNI_COMPLETO = /^\d{7,8}$/;

/** Fecha ISO (o timestamp) → "aaaa-mm-dd" para el formulario. */
const soloFecha = (valor: string | null | undefined) => (valor ? valor.slice(0, 10) : undefined);

interface InscripcionFormProps {
  /** Participante ya registrado (acción "Inscribir" de su fila): no se piden sus datos. */
  participante?: ParticipanteEncontrado | null;
  /** Se llama después de cada inscripción exitosa. */
  onInscripto?: (inscripcion: InscripcionCreada) => void;
  /** Abre la documentación del participante recién inscripto. */
  onCargarDocumentacion?: (persona: InscripcionCreada['persona']) => void;
}

/**
 * US-05 — Inscripción de un participante a una disciplina (TASK-31).
 *
 * Formulario directo: datos del participante + disciplina y categoría. Si el
 * DNI ya está registrado, se completan sus datos y se inscribe a esa persona
 * (solo se completan los que le falten). Al elegir disciplina/categoría se
 * muestran las restricciones y la documentación exigida; al confirmar, qué
 * falta presentar y hasta cuándo.
 */
export function InscripcionForm({ participante, onInscripto, onCargarDocumentacion }: InscripcionFormProps) {
  const [resultado, setResultado] = useState<InscripcionCreada | null>(null);
  const [existente, setExistente] = useState<ParticipanteEncontrado | null>(participante ?? null);
  const busqueda = useBuscarParticipante();
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  const { enviar, enviando, error: errorEnvio } = useCrearInscripcion();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<InscripcionFormValues>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: participante ? datosDe(participante) : {},
  });

  const dni = watch('dni');
  const disciplinaId = watch('disciplinaId');
  const categoriaDisciplinaId = watch('categoriaDisciplinaId');
  const disciplinaSeleccionada = useMemo(() => disciplinas.find((d) => d.id === disciplinaId), [disciplinas, disciplinaId]);
  const exigeCategoria = categoriasDisponibles(disciplinaSeleccionada).length > 0;

  // Al cambiar de disciplina, la categoría elegida deja de valer.
  useEffect(() => {
    setValue('categoriaDisciplinaId', undefined);
  }, [disciplinaId, setValue]);

  // DNI ya registrado: se completan sus datos (sin un paso de búsqueda aparte).
  const { buscar, limpiar } = busqueda;
  useEffect(() => {
    if (participante) return;
    if (!dni || !DNI_COMPLETO.test(dni)) {
      if (existente) {
        setExistente(null);
        setValue('personaId', undefined);
        limpiar();
      }
      return;
    }
    if (existente?.dni === dni) return;
    // Se espera a que se deje de escribir: un DNI de 7 dígitos también es
    // válido y no hay que buscarlo mientras se tipea el octavo.
    const timer = setTimeout(() => {
      void buscar(dni).then((r) => {
        if (r?.participante && r.participante.dni === dni) {
          setExistente(r.participante);
          // El DNI no se toca: es el que se está escribiendo.
          const datos = datosDe(r.participante);
          (Object.keys(datos) as (keyof InscripcionFormValues)[])
            .filter((campo) => campo !== 'dni')
            .forEach((campo) => setValue(campo, datos[campo]));
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [dni, participante, existente, buscar, limpiar, setValue]);

  const requisitos = useQuery({
    queryKey: ['inscripcion', 'requisitos', disciplinaId, categoriaDisciplinaId ?? null, existente?.id ?? null],
    queryFn: () =>
      obtenerRequisitos({
        disciplinaId: disciplinaId as number,
        categoriaDisciplinaId: categoriaDisciplinaId || undefined,
        personaId: existente?.id,
      }),
    enabled: !!disciplinaId && (!exigeCategoria || !!categoriaDisciplinaId),
  });

  const onSubmit = async (data: InscripcionFormValues) => {
    if (exigeCategoria && !data.categoriaDisciplinaId) {
      setError('categoriaDisciplinaId', { message: 'Debe seleccionar una categoría para esta disciplina' });
      return;
    }
    const payload: CrearInscripcionPayload = {
      ...data,
      personaId: existente?.id,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
    };
    const creada = await enviar(payload).catch(() => null);
    if (creada) {
      setResultado(creada);
      onInscripto?.(creada);
    }
  };

  function nuevaInscripcion() {
    setResultado(null);
    if (!participante) {
      setExistente(null);
      limpiar();
    }
    reset(participante ? datosDe(participante) : {});
  }

  if (resultado) {
    const estado = resultado.estadoDocumental;
    return (
      <div className="space-y-4" role="status">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">
            {resultado.persona.nombre} {resultado.persona.apellido} quedó inscripto correctamente.
          </p>
        </div>
        {estado && (
          <div className="space-y-2 rounded-lg border border-slate-200 p-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
              Documentación: <EstadoHabilitacionBadge estado={estado.estado} />
            </p>
            {estado.motivos.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-slate-600">
                {estado.motivos.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">
                {estado.documentos.length ? 'Tiene toda la documentación exigida.' : 'La disciplina no exige documentación.'}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {onCargarDocumentacion && estado && estado.documentos.length > 0 && (
            <Button type="button" onClick={() => onCargarDocumentacion(resultado.persona)}>
              <FileText size={16} /> Cargar documentación
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={nuevaInscripcion}>
            Nueva inscripción
          </Button>
        </div>
      </div>
    );
  }

  const bloquearDatos = !!existente;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-slate-800">Participante</legend>
        {existente && (
          <p className="flex items-center gap-2 rounded-lg border border-brand-200/70 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <UserCheck size={16} className="shrink-0" />
            {participante
              ? `${existente.apellido}, ${existente.nombre} · DNI ${existente.dni}`
              : `DNI ya registrado: ${existente.apellido}, ${existente.nombre}. Se inscribe con sus datos.`}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="dni" label="DNI" inputMode="numeric" disabled={!!participante} error={errors.dni?.message} {...register('dni')} />
          {busqueda.cargando && (
            <span className="flex items-center gap-2 self-end pb-2 text-xs text-slate-500">
              <Spinner className="h-3.5 w-3.5" /> Buscando DNI…
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="nombre" label="Nombre" disabled={bloquearDatos} error={errors.nombre?.message} {...register('nombre')} />
          <Input id="apellido" label="Apellido" disabled={bloquearDatos} error={errors.apellido?.message} {...register('apellido')} />
          <Controller
            control={control}
            name="fechaNacimiento"
            render={({ field }) => (
              <DateInput
                id="fechaNacimiento"
                label="Fecha de nacimiento"
                // A una persona existente solo se le completa lo que le falte.
                disabled={bloquearDatos && !!existente?.fechaNacimiento}
                error={errors.fechaNacimiento?.message}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <div>
            <label htmlFor="genero" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Género
            </label>
            <Select
              id="genero"
              disabled={bloquearDatos && !!existente?.genero}
              {...register('genero', { setValueAs: (v: string) => (v ? (v as GeneroDisciplina) : undefined) })}
            >
              <option value="">Sin especificar</option>
              {(Object.keys(GENERO_DISCIPLINA_LABELS) as GeneroDisciplina[]).map((g) => (
                <option key={g} value={g}>
                  {GENERO_DISCIPLINA_LABELS[g]}
                </option>
              ))}
            </Select>
          </div>
          <Input id="email" label="Email" type="email" disabled={bloquearDatos} error={errors.email?.message} {...register('email')} />
          <Input id="telefono" label="Teléfono" disabled={bloquearDatos} error={errors.telefono?.message} {...register('telefono')} />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-6">
        <legend className="sr-only">Disciplina</legend>
        {cargandoDisciplinas ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" /> Cargando disciplinas…
          </div>
        ) : (
          <DisciplinaCategoriaSelector
            control={control}
            errors={errors}
            disciplinas={disciplinas}
            disciplinaSeleccionada={disciplinaSeleccionada}
          />
        )}

        {requisitos.data && (
          <section aria-label="Requisitos de la inscripción" className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold">Restricciones:</span>{' '}
              {requisitos.data.restricciones.genero ? GENERO_DISCIPLINA_LABELS[requisitos.data.restricciones.genero] : 'cualquier género'} ·{' '}
              {describirEdad(requisitos.data.restricciones)}
              {describirAniosNacimiento(requisitos.data.restricciones) && ` (${describirAniosNacimiento(requisitos.data.restricciones)})`}
            </p>
            {requisitos.data.documentacion.documentos.length === 0 ? (
              <p className="text-slate-600">No exige documentación.</p>
            ) : (
              <div>
                <p className="mb-2 font-semibold text-slate-700">Documentación obligatoria</p>
                <ul className="space-y-1.5">
                  {requisitos.data.documentacion.documentos.map((doc) => (
                    <li key={doc.tipoDocumento} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-700">
                        {doc.etiqueta}
                        <span className="block text-xs text-slate-500">
                          {etiquetaPlazo(doc.plazoDiasTolerancia)}
                          {doc.estado === 'FALTANTE' && doc.fechaLimite && ` · hasta el ${isoADisplay(doc.fechaLimite)}`}
                        </span>
                      </span>
                      {existente && <EstadoDocumentoBadge estado={doc.estado} />}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Si falta documentación, la inscripción queda <strong>pendiente</strong> hasta presentarla dentro del plazo.
                </p>
              </div>
            )}
          </section>
        )}
      </fieldset>

      {errorEnvio && <p className="text-sm text-red-600">{errorEnvio}</p>}

      <Button type="submit" disabled={enviando} className="w-full justify-center">
        {enviando && <Spinner className="h-4 w-4 text-white" />}
        Confirmar inscripción
      </Button>
    </form>
  );
}

function datosDe(p: ParticipanteEncontrado): Partial<InscripcionFormValues> {
  return {
    personaId: p.id,
    dni: p.dni,
    nombre: p.nombre,
    apellido: p.apellido,
    fechaNacimiento: soloFecha(p.fechaNacimiento),
    genero: p.genero ?? undefined,
    email: p.email ?? undefined,
    telefono: p.telefono ?? undefined,
  };
}
