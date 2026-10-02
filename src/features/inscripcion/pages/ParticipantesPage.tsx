import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus, Search } from 'lucide-react';
import { Button, Input, Modal, Select, Spinner, StatusTabs } from '@/components/ui';
import { AuthContext } from '@/features/auth/context/auth-context';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import { DocumentacionParticipante } from '@/features/documentacion/components/DocumentacionParticipante';
import type { EstadoInscripcionFiltro, ParticipanteConDisciplinas } from '../types';
import { useInscripciones } from '../hooks/useInscripciones';
import { ParticipantesTable } from '../components/ParticipantesTable';
import { InscripcionForm } from '../components/InscripcionForm';

const POR_PAGINA = 10;

/**
 * US-08 — Consultar participantes.
 *
 * Lista a los participantes de todas las disciplinas y permite combinar la
 * búsqueda por nombre/apellido/DNI con filtros de disciplina y estado.
 *
 * DT-11 — Es la pantalla única del participante: desde acá se inscribe
 * (US-05, modal) y se gestiona su documentación (US-24, modal). Las rutas
 * viejas /inscripcion y /documentacion redirigen acá.
 */
export function ParticipantesPage() {
  const auth = useContext(AuthContext);
  const puedeInscribir = !auth || auth.usuario?.roles.some((r) => ['ADMIN', 'DELEGADO'].includes(r));
  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoInscripcionFiltro | undefined>(undefined);
  const [pagina, setPagina] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const inscripcionAbierta = Boolean(puedeInscribir) && searchParams.get('nueva') === '1';
  const [conDocumentacion, setConDocumentacion] = useState<ParticipanteConDisciplinas | null>(null);

  const abrirInscripcion = () => setSearchParams({ nueva: '1' });
  const cerrarInscripcion = () => setSearchParams({});

  const { disciplinas } = useDisciplinasActivas();

  // Debounce de la búsqueda: evita pegarle a la API en cada tecla. Solo vuelve
  // a la página 1 si la búsqueda cambió (si no, pisaba un "Siguiente" hecho
  // en los primeros 300 ms).
  useEffect(() => {
    const nueva = textoInput.trim();
    if (nueva === busqueda) return;
    const timer = setTimeout(() => {
      setPagina(1);
      setBusqueda(nueva);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoInput, busqueda]);

  const { data, isLoading, isError, error, isFetching } = useInscripciones({
    busqueda: busqueda || undefined,
    disciplinaId,
    estado,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.porPagina)) : 1;
  const hayResultados = (data?.items.length ?? 0) > 0;

  const cambiarDisciplina = (value: string) => {
    setPagina(1);
    setDisciplinaId(value ? Number(value) : undefined);
  };

  const cambiarEstado = (value: string) => {
    setPagina(1);
    setEstado(value ? (value as EstadoInscripcionFiltro) : undefined);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Participantes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buscá participantes y filtrá por disciplina o estado.
          </p>
        </div>

        {puedeInscribir && (
          <Button onClick={abrirInscripcion} className="self-start shadow-xs sm:self-auto">
            <Plus size={16} />
            Nueva inscripción
          </Button>
        )}
      </header>

      <Modal
        open={inscripcionAbierta}
        title="Nueva inscripción"
        description="Buscá al participante por DNI o registrá uno nuevo, y asignalo a una disciplina."
        onClose={cerrarInscripcion}
        className="max-w-3xl"
      >
        <InscripcionForm />
      </Modal>

      <Modal
        open={conDocumentacion !== null}
        title={
          conDocumentacion
            ? `Documentación de ${conDocumentacion.persona.apellido}, ${conDocumentacion.persona.nombre}`
            : 'Documentación'
        }
        description={conDocumentacion ? `DNI ${conDocumentacion.persona.dni}` : undefined}
        onClose={() => setConDocumentacion(null)}
        className="max-w-2xl"
      >
        {conDocumentacion && <DocumentacionParticipante persona={conDocumentacion.persona} />}
      </Modal>

      {/* Controles de filtro y búsqueda agrupados */}
      <div className="space-y-3">
        {/* Selector de estado estilo pestañas segmentadas (Apex) */}
      <div>
        <StatusTabs<string>
          value={estado ?? 'TODOS'}
          onChange={(val) => cambiarEstado(val === 'TODOS' ? '' : val)}
          tabs={[
            { value: 'TODOS', label: 'Todos' },
            { value: 'INSCRIPTO', label: 'Inscriptos' },
            { value: 'BAJA', label: 'Baja' },
          ]}
        />

        {/* Accesibilidad y compatibilidad con pruebas */}
        <select
          id="estado"
          aria-label="Filtrar por estado"
          value={estado ?? ''}
          onChange={(e) => cambiarEstado(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        >
          <option value="">Todos los estados</option>
          <option value="INSCRIPTO">Inscripto</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>

      {/* Barra de búsqueda y disciplina estilo Apex */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            id="busqueda-participantes"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            leftIcon={<Search />}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select
            id="disciplina"
            aria-label="Filtrar por disciplina"
            value={disciplinaId ?? ''}
            onChange={(e) => cambiarDisciplina(e.target.value)}
            leftIcon={<Filter />}
            className="w-full sm:w-52"
          >
            <option value="">Todas las disciplinas</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'No se pudieron cargar los participantes.'}
        </div>
      ) : (
        <>
          <ParticipantesTable
            participantes={data?.items ?? []}
            onVerDocumentacion={puedeInscribir ? setConDocumentacion : undefined}
          />

          {hayResultados && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {data?.total ?? 0} participante(s){isFetching ? ' · actualizando…' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
