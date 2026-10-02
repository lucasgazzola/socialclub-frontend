import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { DisciplinasPage } from './DisciplinasPage';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseDisciplinas = vi.fn();
const mockCrear = vi.fn();
const mockActualizar = vi.fn();
const mockDesactivar = vi.fn();
const mockReactivar = vi.fn();

vi.mock('../hooks/useDisciplinas', () => ({
  useDisciplinas: (params: any) => mockUseDisciplinas(params),
  useCrearDisciplina: () => ({
    mutateAsync: mockCrear,
    isPending: false,
  }),
  useActualizarDisciplina: () => ({
    mutateAsync: mockActualizar,
    isPending: false,
  }),
  useDesactivarDisciplina: () => ({
    mutateAsync: mockDesactivar,
    isPending: false,
  }),
  useReactivarDisciplina: () => ({
    mutateAsync: mockReactivar,
    isPending: false,
  }),
}));

vi.mock('../components/DisciplinaForm', () => ({
  DisciplinaForm: ({ disciplina, onSubmit, onCancel }: any) => (
    <div data-testid="disciplina-form-mock">
      <span>{disciplina ? `Editando: ${disciplina.nombre}` : 'Nueva disciplina'}</span>
      <button
        onClick={() =>
          onSubmit({
            nombre: 'Natación',
            descripcion: 'Piscina olímpica',
            requiereAptoFisico: true,
          })
        }
      >
        Guardar Mock
      </button>
      <button onClick={onCancel}>Cancelar Mock</button>
    </div>
  ),
}));

vi.mock('../components/DisciplinasTable', () => ({
  DisciplinasTable: ({ disciplinas, onEditar, onCambiarEstado }: any) => (
    <div data-testid="disciplinas-table-mock">
      {disciplinas.map((d: any) => (
        <div key={d.id}>
          <span>{d.nombre}</span>
          <button onClick={() => onEditar(d)}>Editar {d.id}</button>
          <button onClick={() => onCambiarEstado(d)}>
            {d.activo ? 'Desactivar' : 'Reactivar'} {d.id}
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe('DisciplinasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    });
    mockUseDisciplinas.mockReturnValue({
      data: {
        items: [
          { id: 1, nombre: 'Básquet', activo: true },
          { id: 2, nombre: 'Tenis', activo: false },
        ],
        total: 12,
        porPagina: 10,
        conteos: { todas: 12, activas: 10, inactivas: 2 },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
  });

  it('muestra spinner cuando está cargando', () => {
    mockUseDisciplinas.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(<DisciplinasPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la consulta', () => {
    mockUseDisciplinas.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al cargar actividades'),
    });

    renderWithProviders(<DisciplinasPage />);
    expect(screen.getByText('Error al cargar actividades')).toBeInTheDocument();
  });

  it('muestra estado vacío si no hay disciplinas', () => {
    mockUseDisciplinas.mockReturnValue({
      data: { items: [], total: 0, porPagina: 10, conteos: { todas: 0, activas: 0, inactivas: 0 } },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<DisciplinasPage />);
    expect(
      screen.getByText('No hay disciplinas que coincidan con los filtros.'),
    ).toBeInTheDocument();
  });

  it('renderiza tabla de disciplinas y permite crear una nueva', async () => {
    const user = userEvent.setup();
    mockCrear.mockResolvedValueOnce({});

    renderWithProviders(<DisciplinasPage />);

    expect(screen.getByText('Disciplinas')).toBeInTheDocument();
    expect(screen.getByText('Básquet')).toBeInTheDocument();
    expect(screen.getByText('Tenis')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nueva disciplina/i }));
    expect(screen.getByTestId('disciplina-form-mock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar Mock' }));

    await waitFor(() => {
      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Natación',
          descripcion: 'Piscina olímpica',
        }),
      );
    });
  });

  it('permite editar una disciplina existente', async () => {
    const user = userEvent.setup();
    mockActualizar.mockResolvedValueOnce({});

    renderWithProviders(<DisciplinasPage />);

    await user.click(screen.getByRole('button', { name: 'Editar 1' }));
    expect(screen.getByText('Editando: Básquet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar Mock' }));

    await waitFor(() => {
      expect(mockActualizar).toHaveBeenCalledWith({
        id: 1,
        payload: expect.objectContaining({
          nombre: 'Natación',
        }),
      });
    });
  });

  it('permite cambiar estado con el diálogo de confirmación', async () => {
    const user = userEvent.setup();
    mockDesactivar.mockResolvedValueOnce({});

    renderWithProviders(<DisciplinasPage />);

    await user.click(screen.getByRole('button', { name: 'Desactivar 1' }));

    expect(screen.getByText('Desactivar disciplina')).toBeInTheDocument();

    const confirmarBtn = screen.getByRole('button', { name: 'Desactivar' });
    await user.click(confirmarBtn);

    await waitFor(() => {
      expect(mockDesactivar).toHaveBeenCalledWith(1);
    });
  });
});
