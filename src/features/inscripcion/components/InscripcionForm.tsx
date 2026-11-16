import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { CheckCircle2, FileText, Plus, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { Button, DateInput, Input, ModalActions, Select, Spinner } from '@/components/ui';
import { formatearDni } from '@/lib/utils/dni';
import { isoADisplay } from '@/lib/utils/fecha';
import {
  GENERO_DISCIPLINA_LABELS,
  categoriasDisponibles,
  describirAniosNacimiento,
  describirEdad,
  etiquetaPlazo,
  requiereVencimiento,
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
  confirmarEmail: '',
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
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<
    Array<{ disciplinaId: number; categoriaDisciplinaId?: number }>
  >([{ disciplinaId: 0, categoriaDisciplinaId: undefined }]);
  const [errorDisciplinas, setErrorDisciplinas] = useState<string | null>(null);
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
  const fechaNacimientoForm = watch('fechaNacimiento');
  const generoForm = watch('genero');

  const pActual = participante ?? existente;
  const fechaNacActual = pActual?.fechaNacimiento ? soloFecha(pActual.fechaNacimiento) : fechaNacimientoForm;
  const generoActual = pActual?.genero ?? generoForm;

  const participanteRestricciones = useMemo(
    () => ({ fechaNacimiento: fechaNacActual, genero: generoActual }),
    [fechaNacActual, generoActual],
  );

  // Si alguna categoría elegida deja de ser válida para el participante, se resetea.
  useEffect(() => {
    setDisciplinasSeleccionadas((prev) => {
      let cambio = false;
      const next = prev.map((row) => {
        if (!row.disciplinaId || !row.categoriaDisciplinaId) return row;
        const disc = disciplinas.find((d) => d.id === row.disciplinaId);
        const validas = categoriasDisponibles(disc, undefined, participanteRestricciones);
        if (!validas.some((c) => c.id === row.categoriaDisciplinaId)) {
          cambio = true;
          return { ...row, categoriaDisciplinaId: undefined };
        }
        return row;
      });
      return cambio ? next : prev;
    });
  }, [disciplinas, participanteRestricciones]);

  const handleAgregarDisciplina = () => {
    setDisciplinasSeleccionadas((prev) => [
      ...prev,
      { disciplinaId: 0, categoriaDisciplinaId: undefined },
    ]);
    setErrorDisciplinas(null);
  };

  const handleEliminarDisciplina = (index: number) => {
    setDisciplinasSeleccionadas((prev) => prev.filter((_, i) => i !== index));
    setErrorDisciplinas(null);
  };

  const handleDisciplinaChange = (index: number, value: number) => {
    setDisciplinasSeleccionadas((prev) => {
      const next = [...prev];
      next[index] = { disciplinaId: value, categoriaDisciplinaId: undefined };
      return next;
    });
    setAdjuntos({});
    setErrorDisciplinas(null);
  };

  const handleCategoriaChange = (index: number, value: number | undefined) => {
    setDisciplinasSeleccionadas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], categoriaDisciplinaId: value };
      return next;
    });
    setErrorDisciplinas(null);
  };

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

  const requisitosQueries = useQueries({
    queries: disciplinasSeleccionadas.map((row) => {
      const disc = disciplinas.find((d) => d.id === row.disciplinaId);
      const exigeCat = (disc?.categorias ?? []).length > 0;
      const habilitado = row.disciplinaId > 0 && (!exigeCat || !!row.categoriaDisciplinaId);
      return {
        queryKey: [
          'inscripcion',
          'requisitos',
          row.disciplinaId,
          row.categoriaDisciplinaId ?? null,
          existente?.id ?? null,
        ],
        queryFn: () =>
          obtenerRequisitos({
            disciplinaId: row.disciplinaId,
            categoriaDisciplinaId: row.categoriaDisciplinaId || undefined,
            personaId: existente?.id,
          }),
        enabled: habilitado,
      };
    }),
  });

  const requisitosCargados = useMemo(
    () =>
      requisitosQueries
        .map((q, index) => {
          const row = disciplinasSeleccionadas[index];
          const disc = disciplinas.find((d) => d.id === row?.disciplinaId);
          return q.data && disc ? { disciplina: disc, data: q.data } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [requisitosQueries, disciplinasSeleccionadas, disciplinas],
  );

  const onSubmit = async (data: InscripcionFormValues) => {
    const validas = disciplinasSeleccionadas.filter((d) => d.disciplinaId > 0);
    if (validas.length === 0) {
      setErrorDisciplinas('Debe seleccionar al menos una disciplina');
      return;
    }

    for (const row of validas) {
      const disc = disciplinas.find((d) => d.id === row.disciplinaId);
      if ((disc?.categorias ?? []).length > 0 && !row.categoriaDisciplinaId) {
        setErrorDisciplinas(`Debe seleccionar una categoría para ${disc?.nombre ?? 'la disciplina'}`);
        return;
      }
    }
    setErrorDisciplinas(null);

    // Validar adjuntos activos
    let hayErrorAdjuntos = false;
    const nuevosAdjuntos = { ...adjuntos };
    const hoyIso = new Date().toISOString().slice(0, 10);

    for (const [tipo, adj] of Object.entries(adjuntos)) {
      if (adj.habilitado) {
        const pideVencimiento = requiereVencimiento(tipo as TipoDocumentacionDisciplina);
        if (pideVencimiento && !adj.fechaVencimiento) {
          nuevosAdjuntos[tipo] = { ...adj, error: 'La fecha de vencimiento es obligatoria para adjuntar el documento.' };
          hayErrorAdjuntos = true;
        } else if (adj.fechaVencimiento && adj.fechaVencimiento < hoyIso) {
          nuevosAdjuntos[tipo] = { ...adj, error: 'La fecha de vencimiento no puede ser anterior a la fecha actual.' };
          hayErrorAdjuntos = true;
        } else if (!adj.archivo) {
          nuevosAdjuntos[tipo] = { ...adj, error: 'Debe seleccionar un archivo (PDF o imagen) para el documento.' };
          hayErrorAdjuntos = true;
        }
      }
    }

    if (hayErrorAdjuntos) {
      setAdjuntos(nuevosAdjuntos);
      return;
    }

    const docsAEnviar = Object.entries(adjuntos)
      .filter(
        ([tipo, a]) =>
          a.habilitado &&
          (!requiereVencimiento(tipo as TipoDocumentacionDisciplina) || Boolean(a.fechaVencimiento)),
      )
      .map(([tipo, a]) => ({
        tipoDocumento: tipo as TipoDocumentacionDisciplina,
        ...(a.fechaVencimiento ? { fechaVencimiento: a.fechaVencimiento } : {}),
      }));

    const payload: CrearInscripcionPayload = {
      ...data,
      personaId: existente?.id,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
      confirmarEmail: data.email ? data.confirmarEmail : undefined,
      disciplinas: validas.map((d) => ({
        disciplinaId: d.disciplinaId,
        ...(d.categoriaDisciplinaId ? { categoriaDisciplinaId: d.categoriaDisciplinaId } : {}),
      })),
      ...(docsAEnviar.length > 0 ? { documentos: docsAEnviar } : {}),
    };

    setErrorEnvio(null);
    const creada = await enviar(payload).catch((error: unknown) => {
      const mensaje = error instanceof Error ? error.message : 'No se pudo registrar la inscripción';
      // Si el error es de un campo, se marca en ese campo; si no, se muestra abajo.
      if (/coinciden|confirm/i.test(mensaje)) setError('confirmarEmail', { message: mensaje });
      else if (/email/i.test(mensaje)) setError('email', { message: mensaje });
      else if (/DNI/.test(mensaje)) setError('dni', { message: mensaje });
      else setErrorEnvio(mensaje);
      return null;
    });

    if (creada) {
      // Subir archivos binarios si fueron adjuntados
      const conArchivo = Object.entries(adjuntos).filter(
        ([tipo, a]) =>
          a.habilitado &&
          (!requiereVencimiento(tipo as TipoDocumentacionDisciplina) || Boolean(a.fechaVencimiento)) &&
          a.archivo,
      );
      if (conArchivo.length > 0) {
        for (const [tipo, a] of conArchivo) {
          try {
            await documentacionApi.crear(
              {
                personaId: creada.persona.id,
                tipoDocumento: tipo as TipoDocumentacionDisciplina,
                ...(a.fechaVencimiento ? { fechaVencimiento: a.fechaVencimiento } : {}),
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
    reset({ ...FORMULARIO_VACIO });
  }

  function nuevaInscripcion() {
    setResultado(null);
    setAdjuntos({});
    setDisciplinasSeleccionadas([{ disciplinaId: 0, categoriaDisciplinaId: undefined }]);
    setErrorDisciplinas(null);
    if (!participante) {
      setExistente(null);
      limpiar();
    }
    reset(participante ? datosDe(participante) : {});
  }

  if (resultado) {
    const estado = resultado.estadoDocumental;
    const cuotas =
      resultado.cuotasGeneradas && resultado.cuotasGeneradas.length > 0
        ? resultado.cuotasGeneradas
        : resultado.cuotaGenerada
          ? [resultado.cuotaGenerada]
          : [];
    const cantidadInscripciones = resultado.inscripciones?.length ?? 1;
    return (
      <div className="space-y-4" role="status">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">
            {resultado.persona.nombre} {resultado.persona.apellido} quedó inscripto correctamente
            {cantidadInscripciones > 1 ? ` en ${cantidadInscripciones} disciplinas` : ''}.
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
        {cuotas.length > 0 && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm">
            {cuotas.map((cuota, idx) => (
              <div key={`${cuota.periodo}-${idx}`} className="space-y-1">
                <p className="font-medium text-slate-800">
                  Cuota deportiva (período {cuota.periodo}):
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
            ))}
          </div>
        )}
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onCancel ?? nuevaInscripcion}>
            Cerrar
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Paso n={1} /> Datos del participante
        </legend>
        {pActual ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200/70 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <span className="flex flex-wrap items-center gap-1.5">
              <UserCheck size={16} className="shrink-0" />
              <strong>{pActual.apellido}, {pActual.nombre}</strong>
              <span className="text-brand-400">·</span>
              <span>DNI {formatearDni(pActual.dni)}</span>
              {pActual.fechaNacimiento && (
                <>
                  <span className="text-brand-400">·</span>
                  <span>Fecha de nacimiento: {isoADisplay(soloFecha(pActual.fechaNacimiento) || '')}</span>
                </>
              )}
              {pActual.email && (
                <>
                  <span className="text-brand-400">·</span>
                  <span>Email: {pActual.email}</span>
                </>
              )}
            </span>
            {existente && !participante && (
              <Button type="button" variant="ghost" size="sm" onClick={usarOtroDni}>
                Usar otro DNI
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="sm:max-w-xs">
              <Input id="dni" label="DNI" inputMode="numeric" placeholder="Sin puntos" error={errors.dni?.message} {...register('dni')} />
              {!errors.dni && (
                <p className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs" aria-live="polite">
                  {busqueda.cargando ? (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Spinner className="h-3.5 w-3.5" /> Buscando DNI…
                    </span>
                  ) : dni && DNI_COMPLETO.test(dni) && busqueda.noEncontrado ? (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <UserPlus size={14} /> DNI nuevo: se va a registrar un participante nuevo.
                    </span>
                  ) : (
                    <span className="text-slate-500">Si ya está registrado, se completan sus datos.</span>
                  )}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="nombre" label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
              <Input id="apellido" label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
              <Controller
                control={control}
                name="fechaNacimiento"
                render={({ field }) => (
                  <DateInput
                    id="fechaNacimiento"
                    label="Fecha de nacimiento"
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
              <Input id="email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
              {/* DT-54: con email, el participante recibe un enlace para activar su cuenta. */}
              <Input
                id="confirmarEmail"
                label="Repetí el email"
                type="email"
                autoComplete="off"
                error={errors.confirmarEmail?.message}
                {...register('confirmarEmail')}
              />
              <Input id="telefono" label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between gap-2">
          <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Paso n={2} /> Disciplinas
          </legend>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAgregarDisciplina}
            disabled={cargandoDisciplinas || disciplinasSeleccionadas.length >= disciplinas.length}
          >
            <Plus size={14} />
            Agregar disciplina
          </Button>
        </div>

        {cargandoDisciplinas ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" /> Cargando disciplinas…
          </div>
        ) : (
          <div className="space-y-3">
            {disciplinasSeleccionadas.map((row, index) => {
              const disc = disciplinas.find((d) => d.id === row.disciplinaId);
              const categorias = categoriasDisponibles(disc, undefined, participanteRestricciones);
              const tieneCategorias = (disc?.categorias ?? []).length > 0;
              const disciplinasDisponiblesFila = disciplinas.filter(
                (d) =>
                  d.id === row.disciplinaId ||
                  !disciplinasSeleccionadas.some((other, i) => i !== index && other.disciplinaId === d.id),
              );

              return (
                <div
                  key={`insc-disc-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`disciplinaId-${index}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Disciplina
                    </label>
                    <Select
                      id={`disciplinaId-${index}`}
                      value={row.disciplinaId || ''}
                      onChange={(e) =>
                        handleDisciplinaChange(index, e.target.value ? Number(e.target.value) : 0)
                      }
                    >
                      <option value="">Seleccioná una disciplina</option>
                      {disciplinasDisponiblesFila.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {tieneCategorias && (
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`categoriaDisciplinaId-${index}`}
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Categoría
                      </label>
                      <Select
                        id={`categoriaDisciplinaId-${index}`}
                        value={row.categoriaDisciplinaId ?? ''}
                        disabled={categorias.length === 0}
                        onChange={(e) =>
                          handleCategoriaChange(
                            index,
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      >
                        <option value="">
                          {categorias.length === 0
                            ? 'No hay categorías que cumplan edad/género'
                            : 'Seleccioná una categoría'}
                        </option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {disciplinasSeleccionadas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Quitar disciplina"
                      onClick={() => handleEliminarDisciplina(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              );
            })}
            {errorDisciplinas && (
              <p className="text-xs text-rose-600">{errorDisciplinas}</p>
            )}
          </div>
        )}

        {requisitosCargados.length > 0 && (() => {
          const docsMap = new Map<string, (typeof requisitosCargados)[number]['data']['documentacion']['documentos'][number]>();
          for (const item of requisitosCargados) {
            for (const doc of item.data.documentacion.documentos) {
              const previo = docsMap.get(doc.tipoDocumento);
              if (!previo || doc.plazoDiasTolerancia < previo.plazoDiasTolerancia) {
                docsMap.set(doc.tipoDocumento, doc);
              }
            }
          }
          const docs = Array.from(docsMap.values());
          const obligatorios = docs.filter((d) => d.plazoDiasTolerancia === 0);
          const opcionales = docs.filter((d) => d.plazoDiasTolerancia > 0);

          const renderItemDocumento = (doc: (typeof docs)[number]) => {
            const esFaltante = doc.estado === 'FALTANTE' || !existente;
            const adjunto = adjuntos[doc.tipoDocumento];
            return (
              <li key={doc.tipoDocumento} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-700 font-medium">
                    {doc.etiqueta}
                    {doc.plazoDiasTolerancia > 0 && (
                      <span className="block text-xs font-normal text-slate-500">
                        {etiquetaPlazo(doc.plazoDiasTolerancia)}
                        {doc.estado === 'FALTANTE' && doc.fechaLimite && ` · plazo hasta el ${isoADisplay(doc.fechaLimite)}`}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {existente && <EstadoDocumentoBadge estado={doc.estado} />}
                    {esFaltante && !adjunto?.habilitado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjuntos((prev) => ({
                            ...prev,
                            [doc.tipoDocumento]: {
                              fechaVencimiento: prev[doc.tipoDocumento]?.fechaVencimiento || '',
                              archivo: prev[doc.tipoDocumento]?.archivo || null,
                              habilitado: true,
                            },
                          }));
                        }}
                      >
                        Cargar
                      </Button>
                    )}
                  </div>
                </div>

                {esFaltante && adjunto?.habilitado && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Adjuntar en esta operación:</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-rose-600 h-6 px-1.5"
                        onClick={() => {
                          setAdjuntos((prev) => ({
                            ...prev,
                            [doc.tipoDocumento]: {
                              fechaVencimiento: '',
                              archivo: null,
                              habilitado: false,
                            },
                          }));
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>

                    <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 bg-slate-50/70 p-2.5 rounded-md border border-slate-200/80">
                      {requiereVencimiento(doc.tipoDocumento) && (
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
                      )}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Archivo adjunto *
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
                                error: prev[doc.tipoDocumento]?.error?.includes('archivo') ? undefined : prev[doc.tipoDocumento]?.error,
                              },
                            }));
                          }}
                          className="block w-full text-xs text-slate-500 file:mr-2.5 file:rounded-md file:border-0 file:bg-brand-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                        />
                        {!requiereVencimiento(doc.tipoDocumento) && adjunto.error && (
                          <p className="mt-1 text-xs text-rose-600">{adjunto.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          };

          return (
            <section aria-label="Requisitos de la inscripción" className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
              <div className="space-y-1">
                {requisitosCargados.map(({ disciplina, data: reqData }) => (
                  <p key={disciplina.id} className="text-slate-700">
                    <span className="font-semibold">
                      Restricciones{requisitosCargados.length > 1 ? ` (${disciplina.nombre})` : ''}:
                    </span>{' '}
                    {reqData.restricciones.genero ? GENERO_DISCIPLINA_LABELS[reqData.restricciones.genero] : 'cualquier género'} ·{' '}
                    {describirEdad(reqData.restricciones)}
                    {describirAniosNacimiento(reqData.restricciones) && ` (${describirAniosNacimiento(reqData.restricciones)})`}
                  </p>
                ))}
              </div>

              {docs.length === 0 ? (
                <p className="text-slate-600">No exige documentación.</p>
              ) : (
                <div className="space-y-4">
                  {obligatorios.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <p className="font-semibold text-slate-800">Hay que presentarlo al inscribirse</p>
                      </div>
                      <ul className="space-y-2">
                        {obligatorios.map(renderItemDocumento)}
                      </ul>
                    </div>
                  )}

                  {opcionales.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <p className="font-semibold text-slate-800">Con plazo para presentar</p>
                      </div>
                      <ul className="space-y-2">
                        {opcionales.map(renderItemDocumento)}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    Lo que hay que presentar al inscribirse no se puede dejar para después. El resto queda pendiente hasta el plazo.
                  </p>
                </div>
              )}
            </section>
          );
        })()}
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
