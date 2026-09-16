import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, Spinner, Button } from '@/components/ui';
import { useInscripcion } from '../hooks/useInscripciones';
import { useInscripcionesPorPersona } from '../hooks/useInscripciones';
import { useActualizarInscripcion } from '../hooks/useActualizarInscripcion';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { DatosNuevoParticipanteForm } from '../components/datosNuevoParticipanteForm';
import { DisciplinaCategoriaSelector } from '../components/disciplinaCategoriaSelector';

export function EditarInscripcionPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const navigate = useNavigate();

  const { data: inscripcion, isLoading, error: errorCarga } = useInscripcion(id);
  const { disciplinas, cargando: cargandoDisciplinas } = useDisciplinasActivas();
  const { mutateAsync, isPending, error: errorEnvio } = useActualizarInscripcion();
  const { data: inscripcionesPersona } = useInscripcionesPorPersona(inscripcion?.personaId ?? 0);

  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<number>(0);
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState<{ disciplinaId: number; categoriaDisciplinaId?: number }[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InscripcionFormValues>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: {
      personaId: 0,
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

  // Populate form with inscripcion data when it loads
  useEffect(() => {
    if (inscripcion) {
      reset({
        personaId: inscripcion.personaId,
        nombre: inscripcion.persona.nombre,
        apellido: inscripcion.persona.apellido,
        dni: inscripcion.persona.dni,
        fechaNacimiento: inscripcion.persona.fechaNacimiento ? inscripcion.persona.fechaNacimiento.split('T')[0] : '',
        email: inscripcion.persona.email ?? '',
        telefono: inscripcion.persona.telefono ?? '',
        disciplinaId: inscripcion.disciplinaId,
        categoriaDisciplinaId: inscripcion.categoriaDisciplinaId ?? undefined,
      });
      setSelectedDisciplinaId(inscripcion.disciplinaId);
      setDisciplinasSeleccionadas([{
        disciplinaId: inscripcion.disciplinaId,
        categoriaDisciplinaId: inscripcion.categoriaDisciplinaId ?? undefined,
      }]);
    }
  }, [inscripcion, reset]);

  // Sync selected disciplines with form when user changes selection
  useEffect(() => {
    if (selectedDisciplinaId > 0) {
      const seleccionada = disciplinasSeleccionadas.find((d) => d.disciplinaId === selectedDisciplinaId);
      if (seleccionada) {
        setValue('disciplinaId', seleccionada.disciplinaId, { shouldValidate: true });
        setValue('categoriaDisciplinaId', seleccionada.categoriaDisciplinaId ?? undefined, { shouldValidate: true });
      }
    }
  }, [selectedDisciplinaId, disciplinasSeleccionadas, setValue]);

  const onSubmit = async (data: InscripcionFormValues) => {
    const seleccionada = disciplinasSeleccionadas.find(d => d.disciplinaId === data.disciplinaId);
    if (seleccionada?.categoriaDisciplinaId && !data.categoriaDisciplinaId) {
      setError('categoriaDisciplinaId', {
        message: 'Debe seleccionar una categoría para esta disciplina',
      });
      return;
    }

    const payload = {
      ...data,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
      telefono: data.telefono || undefined,
    };

    await mutateAsync({ id, payload });
    navigate('/inscripcion', { state: { mensaje: 'Participante actualizado correctamente.' } });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!inscripcion || errorCarga) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        No se pudo cargar la inscripción.
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
              Modificá los datos de <strong>{inscripcion.persona.apellido}, {inscripcion.persona.nombre}</strong>.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/inscripcion')}>
            ← Volver
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-slate-900">Disciplinas actuales</h2>
        </div>

        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Disciplinas del participante</label>
          <select
            value={selectedDisciplinaId}
            onChange={(e) => setSelectedDisciplinaId(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="0">Seleccionar disciplina a editar</option>
            {inscripcionesPersona?.map((insc) => (
              <option key={insc.id} value={insc.disciplinaId}>
                {insc.disciplina.nombre} {insc.categoriaDisciplina?.nombre ? `(${insc.categoriaDisciplina.nombre})` : ''} {insc.id === id ? '(editando)' : ''}
              </option>
            ))}
            <option value="nueva">+ Agregar nueva disciplina</option>
          </select>
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Editar inscripción seleccionada
            </p>
          </div>
          <DatosNuevoParticipanteForm register={register} errors={errors} />

          {cargandoDisciplinas ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner className="h-4 w-4" /> Cargando disciplinas…
            </div>
          ) : (
            <DisciplinaCategoriaSelector
              control={control}
              errors={errors}
              disciplinas={disciplinas}
              disciplinaSeleccionada={disciplinas.find((d) => d.id === selectedDisciplinaId)}
            />
          )}

          {errorEnvio && (
            <p className="text-sm text-red-600">{errorEnvio?.message ?? 'Error al actualizar'}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full justify-center">
            {isPending ? (
              <>
                <Spinner className="h-4 w-4 text-white" /> Guardando cambios
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}