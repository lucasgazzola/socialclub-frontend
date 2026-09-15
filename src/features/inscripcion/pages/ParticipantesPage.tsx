import { useEffect, useState } from 'react';
import { Button, Input, Select, Spinner } from '@/components/ui';
import { useDisciplinasActivas } from '@/features/disciplinas/hooks/useDisciplinasActivas';
import type { EstadoInscripcionFiltro } from '../types';
import { useInscripciones } from '../hooks/useInscripciones';
import { ParticipantesTable } from '../components/ParticipantesTable';

const POR_PAGINA = 10;

/**
 * US-08 — Consultar participantes.
 *
 * Lista a los participantes de todas las disciplinas y permite combinar la
 * búsqueda por nombre/apellido/DNI con filtros de disciplina y estado.
 */
export function ParticipantesPage() {
  const [textoInput, setTextoInput] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoInscripcionFiltro | undefined>(undefined);
  const [pagina, setPagina] = useState(1);

  const { disciplinas } = useDisciplinasActivas();

  // Debounce de la búsqueda: evita pegarle a la API en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setBusqueda(textoInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [textoInput]);

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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Participantes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Buscá participantes y filtrá por disciplina o estado.
          </p>
        </div>

        <div className="flex w-full max-w-3xl flex-wrap items-end gap-2">
          <Input
            id="busqueda-participantes"
            placeholder="Buscar por nombre, apellido o DNI"
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            className="min-w-55 flex-1"
          />

          <Select
            id="disciplina"
            aria-label="Filtrar por disciplina"
            value={disciplinaId ?? ''}
            onChange={(e) => cambiarDisciplina(e.target.value)}
            className="min-w-40"
          >
            <option value="">Todas las disciplinas</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nombre}
              </option>
            ))}
          </Select>

          <Select
            id="estado"
            aria-label="Filtrar por estado"
            value={estado ?? ''}
            onChange={(e) => cambiarEstado(e.target.value)}
            className="min-w-35"
          >
            <option value="">Todos los estados</option>
            <option value="INSCRIPTO">Inscripto</option>
            <option value="BAJA">Baja</option>
          </Select>
        </div>
      </header>

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
          <ParticipantesTable participantes={data?.items ?? []} />

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
