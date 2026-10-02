import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { HacermeSocioPage } from './HacermeSocioPage';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-redirect">{to}</div>,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockRefrescar = vi.fn();
let mockAuthUser: any = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockAuthUser,
    refrescar: mockRefrescar,
  }),
}));

const mockMutateAsync = vi.fn();
vi.mock('../hooks/useRegistrarmeSocio', () => ({
  useRegistrarmeSocio: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

const mockRefreshApi = vi.fn();
vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    refresh: () => mockRefreshApi(),
  },
}));

vi.mock('../components/HacermeSocioForm', () => ({
  HacermeSocioForm: ({ onSubmit, defaultValues }: any) => (
    <div data-testid="hacerme-socio-form">
      <span>{defaultValues.email}</span>
      <button onClick={() => onSubmit({ dni: '12345678', categoriaId: 2 })}>
        Enviar Form Mock
      </button>
    </div>
  ),
}));

describe('HacermeSocioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige al dashboard si el usuario ya tiene membresía activa', () => {
    mockAuthUser = {
      id: 1,
      email: 'test@socio.com',
      persona: {
        membresias: [{ id: 10, activo: true }],
      },
    };

    renderWithProviders(<HacermeSocioPage />);

    expect(screen.getByTestId('navigate-redirect')).toHaveTextContent('/');
  });

  it('no renderiza nada si el usuario no existe', () => {
    mockAuthUser = null;

    const { container } = renderWithProviders(<HacermeSocioPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza formulario y completa el registro exitosamente', async () => {
    const user = userEvent.setup();
    mockAuthUser = {
      id: 2,
      nombre: 'Carlos',
      apellido: 'Tevez',
      email: 'carlos@club.com',
      persona: null,
    };
    mockMutateAsync.mockResolvedValueOnce({});
    mockRefreshApi.mockResolvedValueOnce({});
    mockRefrescar.mockResolvedValueOnce(undefined);

    renderWithProviders(<HacermeSocioPage />);

    expect(screen.getByText('Hacerme socio')).toBeInTheDocument();
    expect(screen.getByText('carlos@club.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar Form Mock' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ dni: '12345678', categoriaId: 2 });
    });
    expect(mockRefreshApi).toHaveBeenCalled();
    expect(mockRefrescar).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      '¡Felicitaciones! Te registraste como socio correctamente.',
    );
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

