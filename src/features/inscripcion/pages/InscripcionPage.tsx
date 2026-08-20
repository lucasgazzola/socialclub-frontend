import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, UserRound } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { inscripcionSchema, type InscripcionFormValues } from '../schemas/inscripcion.schema';
import { useBuscarParticipante } from '../hooks/useBuscarParticipante';
import { useCrearInscripcion } from '../hooks/useCrearInscripcion';
import { useDisciplinasActivas } from '../../disciplinas/hooks/useDisciplinasActivas';
import { BuscarParticipanteDni } from '../components/buscarParticipanteDni';
import { ParticipanteSeleccionado } from '../components/participanteSeleccionado';
import { DatosNuevoParticipanteForm } from '../components/datosNuevoParticipanteForm';
import { DisciplinaCategoriaSelector } from '../components/disciplinaCategoriaSelector';
import type { CrearInscripcionPayload, InscripcionCreada } from '../types';

type ModoParticipante = 'busqueda' | 'encontrado' | 'nuevo';

/**
 * Página del delegado para registrar la inscripción de un participante a
 * una disciplina. Flujo:
 *
 * 1. Buscar por DNI.
 * 2a. Si existe → se selecciona, no se vuelven a pedir sus datos.
 * 2b. Si no existe → se completa el alta (nombre, apellido, dni, etc.).
 * 3. En ambos casos, se elige disciplina y (si corresponde) categoría.
 * 4. Confirmar → POST /inscripcion.
 */
export function InscripcionPage() {
  const [modo, setModo] = useState<ModoParticipante>('busqueda');
  const [resultado, setResultado] = useState<InscripcionCreada | null>(null);

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
  });

  const disciplinaIdSeleccionada = watch('disciplinaId');
  const disciplinaSeleccionada = useMemo(
    () => disciplinas.find((d) => d.id === disciplinaIdSeleccionada),
    [disciplinas, disciplinaIdSeleccionada],
  );

  const handleBuscar = async (dni: string) => {
    const resultado = await busqueda.buscar(dni);

    if (resultado?.participante) {
      setValue('personaId', resultado.participante.id);
      setModo('encontrado');
    } else if (resultado?.noEncontrado) {
      setValue('personaId', undefined);
      setValue('dni', dni);
      setModo('nuevo');
    }
  };

  const handleRegistrarNuevo = () => {
    setValue('personaId', undefined);
    setModo('nuevo');
  };

  const handleCambiarParticipante = () => {
    busqueda.limpiar();
    reset();
    setModo('busqueda');
  };

  const onSubmit = async (data: InscripcionFormValues) => {
    // La categoría es obligatoria solo si la disciplina elegida tiene
    // categorías configuradas — depende de datos cargados en runtime, así
    // que se valida acá y no en el schema estático.
    if ((disciplinaSeleccionada?.categorias.length ?? 0) > 0 && !data.categoriaDisciplinaId) {
      setError('categoriaDisciplinaId', {
        message: 'Debe seleccionar una categoría para esta disciplina',
      });
      return;
    }

    const payload: CrearInscripcionPayload = {
      ...data,
      fechaNacimiento: data.fechaNacimiento || undefined,
      email: data.email || undefined,
    };

    const creada = await enviar(payload);
    if (creada) {
      setResultado(creada);
      busqueda.limpiar();
      reset();
      setModo('busqueda');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Nueva inscripción</h1>
        <p className="text-sm text-slate-500">
          Buscá al participante por DNI o registrá uno nuevo, y asignalo a una disciplina.
        </p>
      </div>

      {resultado && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {resultado.persona.nombre} {resultado.persona.apellido} quedó inscripto correctamente.
            </p>
          </div>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {modo === 'busqueda' && (
            <BuscarParticipanteDni
              cargando={busqueda.cargando}
              noEncontrado={busqueda.noEncontrado}
              onBuscar={handleBuscar}
              onRegistrarNuevo={handleRegistrarNuevo}
            />
          )}

          {modo === 'encontrado' && busqueda.participante && (
            <ParticipanteSeleccionado
              participante={busqueda.participante}
              onCambiar={handleCambiarParticipante}
            />
          )}

          {modo === 'nuevo' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <UserRound size={16} /> Datos del participante nuevo
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={handleCambiarParticipante}>
                  Volver a buscar
                </Button>
              </div>
              <DatosNuevoParticipanteForm register={register} errors={errors} />
            </div>
          )}

          {modo !== 'busqueda' && (
            <>
              <div className="border-t border-slate-200 pt-6">
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
              </div>

              {errorEnvio && <p className="text-sm text-red-600">{errorEnvio}</p>}

              <Button type="submit" disabled={enviando} className="w-full justify-center">
                {enviando && <Spinner className="h-4 w-4 text-white" />}
                Confirmar inscripción
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
