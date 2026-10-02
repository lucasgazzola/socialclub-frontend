import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Button,
  DateInput,
  Input,
  Modal,
  ModalActions,
  Select,
  Spinner,
  StatusTabs,
} from '@/components/ui';
import { DocumentacionParticipante } from '@/features/documentacion/components/DocumentacionParticipante';
import { ROUTES } from '@/routes/paths';
import { useInscripcionesPorPersona } from '../hooks/useInscripciones';
import { actualizarDatosPersona } from '../api/inscripcion.api';
import { toast } from 'sonner';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import {
  GENERO_DISCIPLINA_LABELS,
  categoriasDisponibles,
  type GeneroDisciplina,
} from '../../disciplinas/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { useCrearInscripcion } from '../hooks/useCrearInscripcion';
import { useActualizarInscripcion } from '../hooks/useActualizarInscripcion';
import { useEliminarInscripcion } from '../hooks/useEliminarInscripcion';
import type { Inscripcion } from '../types';
import { Plus, Trash2, Loader2, UserCog } from 'lucide-react';

interface DisciplinaSeleccionada {
  disciplinaId: number;
  categoriaDisciplinaId?: number;
  inscripcionId?: number;
}

type Pestania = 'datos' | 'documentacion';

interface EditarParticipanteModalProps {
  /** Participante a editar; null cierra el modal. */
  personaId: number | null;
  onClose: () => void;
}

/**
 * US-06 — Editar participante, en modal (DT-20: antes era una página aparte).
 * Dos pestañas: datos y disciplinas, y su documentación (DT-11).
 */
export function EditarParticipanteModal({ personaId, onClose }: EditarParticipanteModalProps) {
  const [pestania, setPestania] = useState<Pestania>('datos');
  return (
    <Modal
      open={personaId !== null}
      onClose={onClose}
      size="xl"
      icon={<UserCog />}
      title="Editar participante"
      description="Datos personales, disciplinas y documentación."
    >
      {personaId !== null && (
        <div className="space-y-5">
          <StatusTabs<Pestania>
            value={pestania}
            onChange={setPestania}
            aria-label="Secciones del participante"
            tabs={[
              { value: 'datos', label: 'Datos y disciplinas' },
              { value: 'documentacion', label: 'Documentación' },
            ]}
          />
          <EditarParticipanteContenido
            key={personaId}
            personaId={personaId}
            pestania={pestania}
            onClose={onClose}
          />
        </div>
      )}
    </Modal>
  );
}

function EditarParticipanteContenido({
  personaId,
  pestania,
  onClose,
}: {
  personaId: number;
  pestania: Pestania;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const {
    data: inscripciones,
    isLoading: loadingInscripciones,
    error: errorInscripciones,
  } = useInscripcionesPorPersona(personaId, true);
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  const { enviar: crearInscripcion, enviando: creando } = useCrearInscripcion();
  const { mutateAsync: actualizarInscripcion, isPending: actualizando } =
    useActualizarInscripcion();
  const { mutateAsync: eliminarInscripcion, isPending: eliminando } = useEliminarInscripcion();

  const [participante, setParticipante] = useState<Inscripcion['persona'] | null>(null);
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<
    DisciplinaSeleccionada[]
  >([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InscripcionFormValues>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: {
      personaId,
      nombre: '',
      apellido: '',
      dni: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      disciplinaId: 0,
      categoriaDisciplinaId: undefined,
    },
  });

  useEffect(() => {
    if (inscripciones && inscripciones.length > 0) {
      const primera = inscripciones[0];
      setParticipante(primera.persona);
      reset({
        personaId: primera.personaId,
        nombre: primera.persona.nombre,
        apellido: primera.persona.apellido,
        dni: primera.persona.dni,
        fechaNacimiento: primera.persona.fechaNacimiento
          ? primera.persona.fechaNacimiento.split('T')[0]
          : '',
        genero: primera.persona.genero ?? undefined,
        email: primera.persona.email ?? '',
        telefono: primera.persona.telefono ?? '',
        disciplinaId: 0,
        categoriaDisciplinaId: undefined,
      });

      const disciplinasIniciales = inscripciones
        .filter((insc) => insc.activo)
        .map((insc) => ({
          disciplinaId: insc.disciplinaId,
          categoriaDisciplinaId: insc.categoriaDisciplinaId ?? undefined,
          inscripcionId: insc.id,
        }));
      setDisciplinasSeleccionadas(disciplinasIniciales);
    }
  }, [inscripciones, reset]);

  const disciplinasConCategoria = disciplinasSeleccionadas.map((d) => {
    const disc = disciplinas.find((disciplina) => disciplina.id === d.disciplinaId);
    const cat = disc?.categorias.find((c) => c.id === d.categoriaDisciplinaId);
    return {
      ...d,
      disciplinaNombre: disc?.nombre ?? 'Desconocida',
      categoriaNombre: cat?.nombre,
    };
  });

  const handleEliminarDisciplina = async (index: number, inscripcionId?: number) => {
    if (inscripcionId) {
      await eliminarInscripcion(inscripcionId);
    }
    const nuevas = [...disciplinasSeleccionadas];
    nuevas.splice(index, 1);
    setDisciplinasSeleccionadas(nuevas);
  };

  const handleAgregarDisciplina = () => {
    setDisciplinasSeleccionadas([
      ...disciplinasSeleccionadas,
      { disciplinaId: 0, categoriaDisciplinaId: undefined },
    ]);
  };

  const handleDisciplinaChange = (index: number, value: number) => {
    const nuevas = [...disciplinasSeleccionadas];
    nuevas[index] = { ...nuevas[index], disciplinaId: value };
    setDisciplinasSeleccionadas(nuevas);
  };

  const handleCategoriaChange = (index: number, value: number | undefined) => {
    const nuevas = [...disciplinasSeleccionadas];
    nuevas[index] = { ...nuevas[index], categoriaDisciplinaId: value };
    setDisciplinasSeleccionadas(nuevas);
  };

  const onSubmit = async (data: InscripcionFormValues) => {
    const payload = {
      ...data,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
      telefono: data.telefono || undefined,
    };

    // Sin disciplinas para crear/actualizar, el camino por inscripción no
    // tiene dónde escribir los datos: guardarlos directo en la Persona
    // (participante dado de baja o reactivado sin disciplinas, US-07).
    if (disciplinasSeleccionadas.length === 0) {
      try {
        await actualizarDatosPersona(personaId, {
          nombre: data.nombre,
          apellido: data.apellido,
          dni: data.dni,
          fechaNacimiento: data.fechaNacimiento || undefined,
          genero: data.genero,
          email: data.email || undefined,
          telefono: data.telefono || undefined,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar el participante');
        return;
      }
      toast.success('Participante actualizado correctamente');
      onClose();
      return;
    }

    for (const d of disciplinasSeleccionadas) {
      if (d.inscripcionId) {
        await actualizarInscripcion({
          id: d.inscripcionId,
          payload: {
            ...payload,
            disciplinaId: d.disciplinaId,
            categoriaDisciplinaId: d.categoriaDisciplinaId,
          },
        });
      } else if (d.disciplinaId > 0) {
        await crearInscripcion({
          ...payload,
          disciplinaId: d.disciplinaId,
          categoriaDisciplinaId: d.categoriaDisciplinaId,
        });
      }
    }

    toast.success('Participante actualizado correctamente');
    onClose();
  };

  if (loadingInscripciones) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Persona sin inscripciones (ni siquiera dadas de baja): no es participante, es socio.
  if (inscripciones && inscripciones.length === 0 && !errorInscripciones) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Esta persona no tiene inscripciones en disciplinas: sus datos se editan desde Socios.</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(ROUTES.editarSocio(personaId))}
        >
          Ir a editar socio
        </Button>
      </div>
    );
  }

  if (errorInscripciones || !participante) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No se pudo cargar el participante.
      </div>
    );
  }

  if (pestania === 'documentacion') {
    return (
      <DocumentacionParticipante
        persona={{ id: personaId, nombre: participante.nombre, apellido: participante.apellido }}
      />
    );
  }

  const guardando = isSubmitting || creando || actualizando || eliminando;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        <strong className="text-slate-800">
          {participante.apellido}, {participante.nombre}
        </strong>{' '}
        · DNI {participante.dni}
      </p>

      {!participante.activo && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este participante está <strong>Inactivo</strong> (dado de baja): podés editar sus datos,
          pero para inscribirlo en disciplinas tenés que reactivarlo desde el listado de
          participantes.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="nombre"
            label="Nombre"
            error={typeof errors.nombre?.message === 'string' ? errors.nombre.message : undefined}
            {...register('nombre')}
          />
          <Input
            id="apellido"
            label="Apellido"
            error={
              typeof errors.apellido?.message === 'string' ? errors.apellido.message : undefined
            }
            {...register('apellido')}
          />
          <Input
            id="dni"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            label="DNI"
            error={typeof errors.dni?.message === 'string' ? errors.dni.message : undefined}
            {...register('dni', {
              setValueAs: (value) =>
                String(value ?? '')
                  .replace(/\D/g, '')
                  .slice(0, 8),
            })}
          />
          <Input
            id="email"
            type="email"
            label="Email"
            error={typeof errors.email?.message === 'string' ? errors.email.message : undefined}
            {...register('email')}
          />
          <Input
            id="telefono"
            type="tel"
            label="Teléfono"
            error={
              typeof errors.telefono?.message === 'string' ? errors.telefono.message : undefined
            }
            {...register('telefono')}
          />
          <Controller
            control={control}
            name="fechaNacimiento"
            render={({ field }) => (
              <DateInput
                id="fechaNacimiento"
                label="Fecha de nacimiento"
                error={
                  typeof errors.fechaNacimiento?.message === 'string'
                    ? errors.fechaNacimiento.message
                    : undefined
                }
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </div>

        <div className="max-w-xs">
          <label
            htmlFor="genero"
            className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-700 uppercase"
          >
            Género
          </label>
          {/* DT-39: lo usan las restricciones de género de disciplinas y categorías. */}
          <Select
            id="genero"
            {...register('genero', {
              setValueAs: (v: string) => (v ? (v as GeneroDisciplina) : undefined),
            })}
          >
            <option value="">Sin especificar</option>
            {(Object.keys(GENERO_DISCIPLINA_LABELS) as GeneroDisciplina[]).map((g) => (
              <option key={g} value={g}>
                {GENERO_DISCIPLINA_LABELS[g]}
              </option>
            ))}
          </Select>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Disciplinas</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAgregarDisciplina}
              disabled={cargandoDisciplinas}
            >
              <Plus size={14} className="mr-1" />
              Agregar disciplina
            </Button>
          </div>

          {disciplinasSeleccionadas.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              El participante no tiene disciplinas asignadas. Agregá una arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {disciplinasConCategoria.map((d, index) => (
                <div
                  key={d.inscripcionId ?? `nueva-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Disciplina
                    </label>
                    <Controller
                      control={control}
                      name="disciplinaId"
                      render={({ field }) => (
                        <select
                          value={d.disciplinaId ?? ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : 0;
                            field.onChange(value);
                            handleDisciplinaChange(index, value);
                          }}
                          className="focus:ring-brand-500 focus:border-brand-500 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                        >
                          <option value="0">Seleccioná una disciplina</option>
                          {disciplinas.map((disc) => (
                            <option key={disc.id} value={disc.id}>
                              {disc.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  {categoriasDisponibles(
                    disciplinas.find((disc) => disc.id === d.disciplinaId),
                    d.categoriaDisciplinaId,
                  ).length > 0 && (
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Categoría
                      </label>
                      <Controller
                        control={control}
                        name="categoriaDisciplinaId"
                        render={({ field }) => (
                          <select
                            value={d.categoriaDisciplinaId ?? ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : undefined;
                              field.onChange(value);
                              handleCategoriaChange(index, value);
                            }}
                            className="focus:ring-brand-500 focus:border-brand-500 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                          >
                            <option value="">Seleccioná una categoría</option>
                            {categoriasDisponibles(
                              disciplinas.find((disc) => disc.id === d.disciplinaId),
                              d.categoriaDisciplinaId,
                            ).map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.activo ? cat.nombre : `${cat.nombre} (dada de baja)`}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleEliminarDisciplina(index, d.inscripcionId)}
                      disabled={eliminando}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? 'Guardando cambios…' : 'Guardar cambios'}
          </Button>
        </ModalActions>
      </form>
    </div>
  );
}
