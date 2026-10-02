import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParticipantesPage } from './ParticipantesPage';
import { useInscripciones } from '../hooks/useInscripciones';

vi.mock('../hooks/useInscripciones', () => ({ useInscripciones: vi.fn() }));

vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [
      { id: 1, nombre: 'Fútbol', activo: true, categorias: [] },
      { id: 2, nombre: 'Vóley', activo: true, categorias: [] },
    ],
    cargando: false,
    error: null,
  }),
}));

vi.mock('../components/ParticipantesTable', () => ({
  ParticipantesTable: ({
    participantes,
    onVerDocumentacion,
  }: {
    participantes: unknown[];
    onVerDocumentacion?: (p: unknown) => void;
  }) => (
    <div>
      <div data-testid="filas">{participantes.length}</div>
      {onVerDocumentacion && (
        <button
          type="button"
          onClick={() => onVerDocumentacion({ persona: { id: 10, nombre: 'Juan', apellido: 'Pérez', dni: '30111222' } })}
        >
          Documentación de prueba
        </button>
      )}
    </div>
  ),
}));

vi.mock('../components/InscripcionForm', () => ({
  InscripcionForm: () => <div data-testid="form-inscripcion" />,
}));

vi.mock('@/features/documentacion/components/DocumentacionParticipante', () => ({
  DocumentacionParticipante: ({ persona }: { persona: { id: number } }) => (
    <div data-testid="documentacion">{persona.id}</div>
  ),
}));

function renderPagina(ruta = '/participantes') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ParticipantesPage />
    </MemoryRouter>,
  );
}

const useInscripcionesMock = useInscripciones as unknown as ReturnType<typeof vi.fn>;

/** Respuesta paginada del listado de participantes. */
function respuesta(items: unknown[] = [], total = items.length) {
  return {
    data: { items, total, pagina: 1, porPagina: 10 },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
  };
}

describe('US-08 · ParticipantesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInscripcionesMock.mockReturnValue(respuesta());
  });

  it('busca por nombre o apellido y combina los filtros de disciplina y estado', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'perez');

    await waitFor(() => {
      expect(useInscripcionesMock).toHaveBeenCalledWith(
        expect.objectContaining({ busqueda: 'perez' }),
      );
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por disciplina'), '1');
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'BAJA');

    await waitFor(() => {
      expect(useInscripcionesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ busqueda: 'perez', disciplinaId: 1, estado: 'BAJA' }),
      );
    });
  });

  it('muestra la lista vacía cuando no hay coincidencias', () => {
    useInscripcionesMock.mockReturnValue(respuesta([], 0));
    renderPagina();

    expect(screen.getByTestId('filas')).toHaveTextContent('0');
  });

  it('pagina los resultados combinando los filtros vigentes', async () => {
    const user = userEvent.setup();
    useInscripcionesMock.mockReturnValue(respuesta([{}, {}], 15));
    renderPagina();

    expect(screen.getByText(/15 participante/)).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(useInscripcionesMock).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 2 }));
    });
  });

  it('no vuelve a la página 1 cuando vence el debounce sin que cambie la búsqueda', async () => {
    const user = userEvent.setup();
    useInscripcionesMock.mockReturnValue(respuesta([{}, {}], 15));
    renderPagina();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await new Promise((resolver) => setTimeout(resolver, 400));

    expect(useInscripcionesMock).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 2 }));
  });

  // DT-11: inscripción y documentación dentro de la pantalla de Participantes.
  it('abre la inscripción en un modal desde "Nueva inscripción"', async () => {
    const user = userEvent.setup();
    renderPagina();

    expect(screen.queryByTestId('form-inscripcion')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Nueva inscripción/ }));

    expect(screen.getByRole('dialog', { name: 'Nueva inscripción' })).toBeInTheDocument();
    expect(screen.getByTestId('form-inscripcion')).toBeInTheDocument();
  });

  it('abre la inscripción al llegar desde la ruta vieja (/participantes?nueva=1)', () => {
    renderPagina('/participantes?nueva=1');

    expect(screen.getByTestId('form-inscripcion')).toBeInTheDocument();
  });

  it('abre la documentación del participante en un modal', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole('button', { name: 'Documentación de prueba' }));

    expect(screen.getByRole('dialog', { name: 'Documentación de Pérez, Juan' })).toBeInTheDocument();
    expect(screen.getByTestId('documentacion')).toHaveTextContent('10');
  });
});
