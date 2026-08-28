import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, Spinner, Button, Input } from '@/components/ui';
import { useInscripcionesPorPersona } from '../hooks/useInscripciones';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { useCrearInscripcion } from '../hooks/useCrearInscripcion';
import { useActualizarInscripcion } from '../hooks/useActualizarInscripcion';
import { useEliminarInscripcion } from '../hooks/useEliminarInscripcion';
import type { Inscripcion } from '../types';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface DisciplinaSeleccionada {
  disciplinaId: number;
  categoriaDisciplinaId?: number;
  inscripcionId?: number;
}

export function EditarParticipantePage() {
  const { id: idParam } = useParams<{ id: string }>();
  const personaId = Number(idParam);
  const navigate = useNavigate();

  const { data: inscripciones, isLoading: loadingInscripciones, error: errorInscripciones } =
    useInscripcionesPorPersona(personaId);
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  const { enviar: crearInscripcion, enviando: creando } = useCrearInscripcion();
  const { mutateAsync: actualizarInscripcion, isPending: actualizando } = useActualizarInscripcion();
  const { mutateAsync: eliminarInscripcion, isPending: eliminando } = useEliminarInscripcion();

  const [participante, setParticipante] = useState<Inscripcion['persona'] | null>(null);
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<DisciplinaSeleccionada[]>([]);

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
        fechaNacimiento: '',
        email: primera.persona.email ?? '',
        telefono: primera.persona.telefono ?? '',
        disciplinaId: 0,
        categoriaDisciplinaId: undefined,
      });

      const disciplinasIniciales = inscripciones.map((insc) => ({
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

    navigate('/inscripcion', { state: { mensaje: 'Participante actualizado correctamente.' } });
  };

  if (loadingInscripciones) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (errorInscripciones || !participante) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No se pudo cargar el participante.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Editar participante</h1>
            <p className="mt-1 text-sm text-slate-500">
              Modificá los datos y las disciplinas de <strong>{participante.apellido}, {participante.nombre}</strong>.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/inscripcion')}>
            ← Volver
          </Button>
        </div>
      </header>

      <Card className="p-6">
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
              error={typeof errors.apellido?.message === 'string' ? errors.apellido.message : undefined}
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
                setValueAs: (value) => String(value ?? '').replace(/\D/g, '').slice(0, 8),
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
              error={typeof errors.telefono?.message === 'string' ? errors.telefono.message : undefined}
              {...register('telefono')}
            />
            <Input
              id="fechaNacimiento"
              type="date"
              label="Fecha de nacimiento"
              error={typeof errors.fechaNacimiento?.message === 'string' ? errors.fechaNacimiento.message : undefined}
              {...register('fechaNacimiento')}
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
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
              <p className="text-sm text-slate-500 text-center py-4">
                El participante no tiene disciplinas asignadas. Agregá una arriba.
              </p>
            ) : (
              <div className="space-y-3">
                {disciplinasConCategoria.map((d, index) => (
                  <div
                    key={d.inscripcionId ?? `nueva-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
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
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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

                    {(disciplinas.find((disc) => disc.id === d.disciplinaId)?.categorias.length ?? 0) > 0 && (
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
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
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            >
                              <option value="">Seleccioná una categoría</option>
                              {disciplinas
                                .find((disc) => disc.id === d.disciplinaId)
                                ?.categorias.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
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

          <Button
            type="submit"
            disabled={isSubmitting || creando || actualizando || eliminando}
            className="w-full justify-center"
          >
            {(isSubmitting || creando || actualizando || eliminando) && (
              <>
                <Loader2 className="h-4 w-4 text-white animate-spin mr-2" />
                Guardando cambios...
              </>
            )}
            {!isSubmitting && !creando && !actualizando && !eliminando && (
              <>
                <Save size={14} className="mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}