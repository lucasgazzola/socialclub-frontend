import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  ParticipantesTable: ({ participantes }: { participantes: unknown[] }) => (
    <div data-testid="filas">{participantes.length}</div>
  ),
}));

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
    render(<ParticipantesPage />);

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
    render(<ParticipantesPage />);

    expect(screen.getByTestId('filas')).toHaveTextContent('0');
  });

  it('pagina los resultados combinando los filtros vigentes', async () => {
    const user = userEvent.setup();
    useInscripcionesMock.mockReturnValue(respuesta([{}, {}], 15));
    render(<ParticipantesPage />);

    expect(screen.getByText(/15 participante/)).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(useInscripcionesMock).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 2 }));
    });
  });
});
