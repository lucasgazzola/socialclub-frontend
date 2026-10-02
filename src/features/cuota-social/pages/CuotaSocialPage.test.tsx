import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuotaSocialPage } from './CuotaSocialPage';
import { useCategorias } from '@/features/socios/hooks/useCategorias';
import { useCuotaSocial } from '../hooks/useCuotaSocial';
import { useConfigurarCuotaSocial } from '../hooks/useConfigurarCuotaSocial';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/socios/hooks/useCategorias', () => ({
  useCategorias: vi.fn(),
}));

vi.mock('../hooks/useCuotaSocial', () => ({
  useCuotaSocial: vi.fn(),
}));

vi.mock('../hooks/useConfigurarCuotaSocial', () => ({
  useConfigurarCuotaSocial: vi.fn(),
}));

vi.mock('../components/CuotaSocialForm', () => ({
  CuotaSocialForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (values: unknown) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="cuota-social-form">
      <button
        type="button"
        onClick={() =>
          onSubmit({
            categoriaId: 1,
            monto: 20000,
            periodoAplicacion: '2026-11',
          })
        }
      >
        Guardar cuota
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  ),
}));

vi.mock('../components/EditarCuotaSocialModal', () => ({
  EditarCuotaSocialModal: ({ cuotaId }: { cuotaId: number | null }) =>
    cuotaId ? <div data-testid="editar-cuota-social-modal">{cuotaId}</div> : null,
}));

const mockConfigurarMutate = vi.fn();

const mockCategorias = [
  { id: 1, nombre: 'Pleno' },
  { id: 2, nombre: 'Cadete' },
];

const mockCuotasSociales = [
  {
    id: 10,
    categoriaId: 1,
    monto: 15000,
    periodoAplicacion: '2026-10',
    activo: true,
    categoria: { id: 1, nombre: 'Pleno' },
  },
];

describe('CuotaSocialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigurarMutate.mockResolvedValue({});

    vi.mocked(useCategorias).mockReturnValue({
      data: mockCategorias,
      isLoading: false,
    } as never);

    vi.mocked(useConfigurarCuotaSocial).mockReturnValue({
      mutateAsync: mockConfigurarMutate,
      isPending: false,
    } as never);

    vi.mocked(useCuotaSocial).mockReturnValue({
      data: {
        items: mockCuotasSociales,
        total: 15,
        pagina: 1,
        porPagina: 10,
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
    } as never);
  });

  function renderPage(initialEntry = '/cuotas/social') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <CuotaSocialPage />
      </MemoryRouter>,
    );
  }

  it('renderiza título, botón de retorno y tabla', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Cuota social/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver a Cuotas/i })).toBeInTheDocument();
    expect(screen.getAllByText('Pleno').length).toBeGreaterThan(0);
  });

  it('vuelve a /cuotas al hacer click en Volver', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Volver a Cuotas/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cuotas');
  });

  it('muestra spinner durante carga', () => {
    vi.mocked(useCuotaSocial).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as never);

    renderPage();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando falla la consulta', () => {
    vi.mocked(useCuotaSocial).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al traer cuotas sociales'),
    } as never);

    renderPage();
    expect(screen.getByText(/Error al traer cuotas sociales/i)).toBeInTheDocument();
  });

  it('filtra por categoría', async () => {
    const user = userEvent.setup();
    renderPage();

    const selectCategoria = screen.getByDisplayValue('Todas las categorías');
    await user.selectOptions(selectCategoria, '1');

    await waitFor(() => {
      expect(useCuotaSocial).toHaveBeenCalledWith(
        expect.objectContaining({ categoriaId: 1, pagina: 1 }),
      );
    });
  });

  it('filtra por período', async () => {
    const user = userEvent.setup();
    renderPage();

    const inputPeriodo = screen.getByPlaceholderText('2026-10');
    await user.type(inputPeriodo, '2026-11');
    await user.click(screen.getByRole('button', { name: /Filtrar/i }));

    await waitFor(() => {
      expect(useCuotaSocial).toHaveBeenCalledWith(
        expect.objectContaining({ periodoAplicacion: '2026-11', pagina: 1 }),
      );
    });
  });

  it('permite avanzar página', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(useCuotaSocial).toHaveBeenCalledWith(expect.objectContaining({ pagina: 2 }));
    });
  });

  it('abre modal para configurar nueva cuota social y llama a mutate', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Configurar cuota social/i }));
    expect(screen.getByTestId('cuota-social-form')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardar cuota/i }));

    await waitFor(() => {
      expect(mockConfigurarMutate).toHaveBeenCalledWith({
        categoriaId: 1,
        monto: 20000,
        periodoAplicacion: '2026-11',
      });
    });
  });

  it('abre modal de edición cuando URL tiene ?editar=10', () => {
    renderPage('/cuotas/social?editar=10');
    expect(screen.getByTestId('editar-cuota-social-modal')).toHaveTextContent('10');
  });
});

