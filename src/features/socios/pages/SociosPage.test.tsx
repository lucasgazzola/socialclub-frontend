import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { SociosPage } from './SociosPage';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseCategorias = vi.fn();
vi.mock('../hooks/useCategorias', () => ({
  useCategorias: () => mockUseCategorias(),
}));

const mockUseSocios = vi.fn();
const mockMutateAsync = vi.fn();
vi.mock('../hooks/useSocios', () => ({
  useSocios: (params: any) => mockUseSocios(params),
  useCrearSocio: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../components/SociosTable', () => ({
  SociosTable: ({ socios }: { socios: any[] }) => (
    <div data-testid="socios-table">
      {socios.map((s) => (
        <div key={s.id}>{s.nombre} {s.apellido}</div>
      ))}
    </div>
  ),
}));

vi.mock('../components/SocioForm', () => ({
  SocioForm: ({ onSubmit, onCancel }: any) => (
    <div data-testid="socio-form">
      <button onClick={() => onSubmit({ nombre: 'Nuevo', apellido: 'Socio', dni: '99999999' })}>
        Guardar Socio
      </button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

vi.mock('../components/EditarSocioModal', () => ({
  EditarSocioModal: ({ socioId, onClose }: any) =>
    socioId ? (
      <div data-testid="editar-socio-modal">
        <span>Editando socio #{socioId}</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

describe('SociosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    });
    mockUseCategorias.mockReturnValue({
      data: [{ id: 1, nombre: 'Activo' }, { id: 2, nombre: 'Cadete' }],
    });
    mockUseSocios.mockReturnValue({
      data: {
        items: [{ id: 1, nombre: 'Juan', apellido: 'Perez' }],
        total: 25,
        porPagina: 10,
        counts: { todos: 25, alta: 20, baja: 5 },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
  });

  it('muestra spinner cuando está cargando', () => {
    mockUseSocios.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(<SociosPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la consulta', () => {
    mockUseSocios.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error de servidor'),
    });

    renderWithProviders(<SociosPage />);
    expect(screen.getByText('Error de servidor')).toBeInTheDocument();
  });

  it('renderiza encabezado, botón Nuevo Socio para admin y lista de socios', () => {
    renderWithProviders(<SociosPage />);

    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nuevo Socio/i })).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('25 socio(s)')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('no muestra el botón Nuevo Socio si el usuario no es admin', () => {
    mockUseAuth.mockReturnValue({
      usuario: { roles: ['SOCIO'] },
    });

    renderWithProviders(<SociosPage />);
    expect(screen.queryByRole('button', { name: /Nuevo Socio/i })).not.toBeInTheDocument();
  });

  it('permite filtrar por categoría y cambiar de página', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<SociosPage />);

    const selectCategoria = container.querySelector('#categoria') as HTMLSelectElement;
    await user.selectOptions(selectCategoria, '1');

    expect(mockUseSocios).toHaveBeenCalledWith(
      expect.objectContaining({
        categoriaId: 1,
        pagina: 1,
      }),
    );

    const btnSiguiente = screen.getByRole('button', { name: /Siguiente/i });
    await user.click(btnSiguiente);

    expect(mockUseSocios).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 2,
      }),
    );
  });

  it('permite buscar socios con debounce en el input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SociosPage />);

    const input = screen.getByPlaceholderText(/Buscar por nombre, apellido o DNI.../i);
    await user.type(input, 'Gomez');

    await waitFor(() => {
      expect(mockUseSocios).toHaveBeenCalledWith(
        expect.objectContaining({
          busqueda: 'Gomez',
        }),
      );
    });
  });

  it('permite abrir el modal de nuevo socio y registrarlo', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});

    renderWithProviders(<SociosPage />);

    const btnNuevo = screen.getByRole('button', { name: /Nuevo Socio/i });
    await user.click(btnNuevo);

    expect(screen.getByTestId('socio-form')).toBeInTheDocument();

    const btnGuardar = screen.getByRole('button', { name: /Guardar Socio/i });
    await user.click(btnGuardar);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        nombre: 'Nuevo',
        apellido: 'Socio',
        dni: '99999999',
      });
    });

    expect(screen.getByText('Socio registrado correctamente.')).toBeInTheDocument();
  });

  it('permite filtrar por estado haciendo clic en las pestañas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SociosPage />);

    expect(screen.getByRole('tab', { name: /^Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Activos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Inactivos/i })).toBeInTheDocument();

    const tabActivos = screen.getByRole('tab', { name: /^Activos/i });
    await user.click(tabActivos);

    expect(mockUseSocios).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'ALTA',
        pagina: 1,
      }),
    );

    const tabInactivos = screen.getByRole('tab', { name: /^Inactivos/i });
    await user.click(tabInactivos);

    expect(mockUseSocios).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: 'BAJA',
        pagina: 1,
      }),
    );
  });
});
