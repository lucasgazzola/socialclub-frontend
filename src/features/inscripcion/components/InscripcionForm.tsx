import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileText, UserCheck, UserPlus } from 'lucide-react';
import { Button, DateInput, Input, ModalActions, Select, Spinner } from '@/components/ui';
import { isoADisplay } from '@/lib/utils/fecha';
import {
  GENERO_DISCIPLINA_LABELS,
  categoriasDisponibles,
  describirAniosNacimiento,
  describirEdad,
  etiquetaPlazo,
  type GeneroDisciplina,
  type TipoDocumentacionDisciplina,
} from '../../disciplinas/types';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { documentacionApi } from '@/features/documentacion/api/documentacion.api';
import { EstadoDocumentoBadge, EstadoHabilitacionBadge } from '../../documentacion/components/EstadoBadges';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { obtenerRequisitos } from '../api/inscripcion.api';
import { useBuscarParticipante } from '../hooks/useBuscarParticipante';
import { useCrearInscripcion } from '../hooks/useCrearInscripcion';
import { DisciplinaCategoriaSelector } from './disciplinaCategoriaSelector';
import type { CrearInscripcionPayload, InscripcionCreada, ParticipanteEncontrado } from '../types';

interface AdjuntoEstado {
  fechaVencimiento: string;
  archivo: File | null;
  habilitado: boolean;
  error?: string;
}

const DNI_COMPLETO = /^\d{7,8}$/;

const FORMULARIO_VACIO: Partial<InscripcionFormValues> = {
  personaId: undefined,
  dni: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  genero: undefined,
  email: '',
  telefono: '',
};

/** Fecha ISO (o timestamp) → "aaaa-mm-dd" para el formulario. */
const soloFecha = (valor: string | null | undefined) => (valor ? valor.slice(0, 10) : undefined);

interface InscripcionFormProps {
  /** Participante ya registrado (acción "Inscribir" de su fila): no se piden sus datos. */
  participante?: ParticipanteEncontrado | null;
  /** Se llama después de cada inscripción exitosa. */
  onInscripto?: (inscripcion: InscripcionCreada) => void;
  /** Cancelar dentro del modal (DT-20). */
  onCancel?: () => void;
  /** Abre la documentación del participante recién inscripto. */
  onCargarDocumentacion?: (persona: InscripcionCreada['persona']) => void;
}

/**
 * US-05 — Inscripción de un participante a una disciplina (TASK-31).
 *
 * Formulario directo: datos del participante + disciplina y categoría. Si el
 * DNI ya está registrado, se completan sus datos y se inscribe a esa persona
 * (solo se completan los que le falten). Al elegir disciplina/categoría se
 * muestran las restricciones y la documentación exigida; permite adjuntar
 * documentos faltantes en la misma operación; al confirmar, informa estado
 * documental y cuota generada.
 */
export function InscripcionForm({ participante, onInscripto, onCancel, onCargarDocumentacion }: InscripcionFormProps) {
  const [resultado, setResultado] = useState<InscripcionCreada | null>(null);
  const [existente, setExistente] = useState<ParticipanteEncontrado | null>(participante ?? null);
  const [adjuntos, setAdjuntos] = useState<Record<string, AdjuntoEstado>>({});
  const busqueda = useBuscarParticipante();
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  // El error se muestra una sola vez, en el formulario (no también como toast).
  const { enviar, enviando } = useCrearInscripcion({ toastDeError: false });
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

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

  // Al cambiar de disciplina, la categoría elegida deja de valer y se resetean adjuntos.
  useEffect(() => {
    setValue('categoriaDisciplinaId', undefined);
    setAdjuntos({});
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

    // Validar adjuntos activos
    let hayErrorAdjuntos = false;
    const nuevosAdjuntos = { ...adjuntos };
    const hoyIso = new Date().toISOString().slice(0, 10);

    for (const [tipo, adj] of Object.entries(adjuntos)) {
      if (adj.habilitado) {
        if (!adj.fechaVencimiento) {
          nuevosAdjuntos[tipo] = { ...adj, error: 'La fecha de vencimiento es obligatoria para adjuntar el documento.' };
          hayErrorAdjuntos = true;
        } else if (adj.fechaVencimiento < hoyIso) {
          nuevosAdjuntos[tipo] = { ...adj, error: 'La fecha de vencimiento no puede ser anterior a la fecha actual.' };
          hayErrorAdjuntos = true;
        }
      }
    }

    if (hayErrorAdjuntos) {
      setAdjuntos(nuevosAdjuntos);
      return;
    }

    const docsAEnviar = Object.entries(adjuntos)
      .filter(([_, a]) => a.habilitado && a.fechaVencimiento)
      .map(([tipo, a]) => ({
        tipoDocumento: tipo as TipoDocumentacionDisciplina,
        fechaVencimiento: a.fechaVencimiento,
      }));

    const payload: CrearInscripcionPayload = {
      ...data,
      personaId: existente?.id,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
      ...(docsAEnviar.length > 0 ? { documentos: docsAEnviar } : {}),
    };

    setErrorEnvio(null);
    const creada = await enviar(payload).catch((error: unknown) => {
      const mensaje = error instanceof Error ? error.message : 'No se pudo registrar la inscripción';
      // Si el error es de un campo, se marca en ese campo; si no, se muestra abajo.
      if (/email/i.test(mensaje)) setError('email', { message: mensaje });
      else if (/DNI/.test(mensaje)) setError('dni', { message: mensaje });
      else setErrorEnvio(mensaje);
      return null;
    });

    if (creada) {
      // Subir archivos binarios si fueron adjuntados
      const conArchivo = Object.entries(adjuntos).filter(
        ([_, a]) => a.habilitado && a.fechaVencimiento && a.archivo,
      );
      if (conArchivo.length > 0) {
        for (const [tipo, a] of conArchivo) {
          try {
            await documentacionApi.crear(
              {
                personaId: creada.persona.id,
                tipoDocumento: tipo as TipoDocumentacionDisciplina,
                fechaVencimiento: a.fechaVencimiento,
              },
              a.archivo,
            );
          } catch {
            // Error al subir archivo individual no interrumpe el alta
          }
        }
        try {
          const resumen = await documentacionApi.estadoPorPersona(creada.persona.id);
          const actualizado = resumen.inscripciones.find(
            (i) => i.inscripcionId === creada.inscripcion.id,
          );
          if (actualizado) {
            creada.estadoDocumental = actualizado;
          }
        } catch {
          // continuar con el estado devuelto por el alta
        }
      }

      setResultado(creada);
      onInscripto?.(creada);
    }
  };

  function usarOtroDni() {
    setExistente(null);
    limpiar();
    setAdjuntos({});
    reset({ ...FORMULARIO_VACIO, disciplinaId: watch('disciplinaId'), categoriaDisciplinaId: watch('categoriaDisciplinaId') });
  }

  function nuevaInscripcion() {
    setResultado(null);
    setAdjuntos({});
    if (!participante) {
      setExistente(null);
      limpiar();
    }
    reset(participante ? datosDe(participante) : {});
  }

  if (resultado) {
    const estado = resultado.estadoDocumental;
    const cuota = resultado.cuotaGenerada;
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
                {estado.documentos.length ? 'Toda la documentación requerida fue presentada.' : 'La disciplina no exige documentación.'}
              </p>
            )}
          </div>
        )}
        {cuota && (
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm">
            <p className="font-medium text-slate-800">
              Cuota deportiva generada (período {cuota.periodo}):
            </p>
            {cuota.sinTarifa ? (
              <p className="text-slate-600">Sin tarifa configurada para este período.</p>
            ) : (
              <p className="text-slate-700">
                Monto generado:{' '}
                <strong className="text-slate-900 font-semibold">
                  ${cuota.monto?.toLocaleString('es-AR')}
                </strong>
                {cuota.descuentoSocioPorcentaje > 0 && (
                  <span className="text-xs text-emerald-700 font-medium">
                    {' '}
                    ({cuota.descuentoSocioPorcentaje}% de descuento por ser socio)
                  </span>
                )}
                <span className="ml-2 text-xs text-amber-700 font-medium">(Pendiente de cobro)</span>
              </p>
            )}
          </div>
        )}
        <ModalActions>
          <Button type="button" variant="secondary" onClick={nuevaInscripcion}>
            Nueva inscripción
          </Button>
          {onCargarDocumentacion && estado && estado.documentos.length > 0 && estado.estado !== 'HABILITADO' && (
            <Button type="button" onClick={() => onCargarDocumentacion(resultado.persona)}>
              <FileText size={16} /> Cargar documentación pendiente
            </Button>
          )}
        </ModalActions>
      </div>
    );
  }

  const bloquearDatos = !!existente;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Paso n={1} /> Datos del participante
        </legend>
        {participante ? (
          <p className="flex items-center gap-2 rounded-lg border border-brand-200/70 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <UserCheck size={16} className="shrink-0" />
            {participante.apellido}, {participante.nombre} · DNI {participante.dni}
          </p>
        ) : (
          <div className="sm:max-w-xs">
            <Input id="dni" label="DNI" inputMode="numeric" placeholder="Sin puntos" error={errors.dni?.message} {...register('dni')} />
            {!errors.dni && (
              <p className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs" aria-live="polite">
                {busqueda.cargando ? (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Spinner className="h-3.5 w-3.5" /> Buscando DNI…
                  </span>
                ) : existente ? null : dni && DNI_COMPLETO.test(dni) && busqueda.noEncontrado ? (
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <UserPlus size={14} /> DNI nuevo: se va a registrar un participante nuevo.
                  </span>
                ) : (
                  <span className="text-slate-500">Si ya está registrado, se completan sus datos.</span>
                )}
              </p>
            )}
          </div>
        )}
        {existente && !participante && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200/70 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <span className="flex items-center gap-2">
              <UserCheck size={16} className="shrink-0" />
              Este DNI es de <strong>{existente.apellido}, {existente.nombre}</strong>: se lo inscribe en otra disciplina con sus datos.
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={usarOtroDni}>
              Usar otro DNI
            </Button>
          </div>
        )}
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
        <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Paso n={2} /> Disciplina
        </legend>
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
                <ul className="space-y-2">
                  {requisitos.data.documentacion.documentos.map((doc) => {
                    const esFaltante = doc.estado === 'FALTANTE' || !existente;
                    const adjunto = adjuntos[doc.tipoDocumento];
                    return (
                      <li key={doc.tipoDocumento} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-700 font-medium">
                            {doc.etiqueta}
                            <span className="block text-xs font-normal text-slate-500">
                              {etiquetaPlazo(doc.plazoDiasTolerancia)}
                              {doc.estado === 'FALTANTE' && doc.fechaLimite && ` · plazo hasta el ${isoADisplay(doc.fechaLimite)}`}
                            </span>
                          </span>
                          {existente && <EstadoDocumentoBadge estado={doc.estado} />}
                        </div>

                        {esFaltante && (
                          <div className="pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={adjunto?.habilitado ?? false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAdjuntos((prev) => ({
                                    ...prev,
                                    [doc.tipoDocumento]: {
                                      fechaVencimiento: prev[doc.tipoDocumento]?.fechaVencimiento || '',
                                      archivo: prev[doc.tipoDocumento]?.archivo || null,
                                      habilitado: checked,
                                    },
                                  }));
                                }}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                              Adjuntar en esta operación (opcional)
                            </label>

                            {adjunto?.habilitado && (
                              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 bg-slate-50/70 p-2.5 rounded-md border border-slate-200/80">
                                <DateInput
                                  id={`vencimiento-${doc.tipoDocumento}`}
                                  label="Fecha de vencimiento *"
                                  value={adjunto.fechaVencimiento || ''}
                                  onChange={(iso) => {
                                    setAdjuntos((prev) => ({
                                      ...prev,
                                      [doc.tipoDocumento]: {
                                        ...prev[doc.tipoDocumento],
                                        fechaVencimiento: iso,
                                        error: undefined,
                                      },
                                    }));
                                  }}
                                  error={adjunto.error}
                                  min={new Date().toISOString().slice(0, 10)}
                                />
                                <div>
                                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Archivo adjunto (opcional)
                                  </label>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    aria-label={`Archivo para ${doc.etiqueta}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setAdjuntos((prev) => ({
                                        ...prev,
                                        [doc.tipoDocumento]: {
                                          ...prev[doc.tipoDocumento],
                                          archivo: file,
                                        },
                                      }));
                                    }}
                                    className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-md file:border-0 file:bg-brand-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Si falta documentación, la inscripción queda <strong>pendiente</strong> hasta presentarla dentro del plazo.
                </p>
              </div>
            )}
          </section>
        )}
      </fieldset>

      {errorEnvio && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorEnvio}
        </p>
      )}

      <ModalActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={enviando}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando && <Spinner className="h-4 w-4 text-white" />}
          {existente ? 'Inscribir' : 'Registrar participante'}
        </Button>
      </ModalActions>
    </form>
  );
}

/** Número de paso del formulario, con el chip de marca. */
function Paso({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
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
