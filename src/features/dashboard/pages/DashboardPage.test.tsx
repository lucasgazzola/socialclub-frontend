import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { DashboardPage } from './DashboardPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
  };
});

let mockUsuario: any = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
  }),
}));

const mockAlertas = vi.fn();
vi.mock('@/features/documentacion/hooks/useDocumentacion', () => ({
  useAlertasDocumentacion: () => mockAlertas(),
  usePendientesRevision: () => ({ data: [], isLoading: false, isError: false }),
  useRevisarDocumento: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlertas.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it('US-26 · el ADMIN ve las alertas de documentación en el Inicio', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Alertas de documentación' })).toBeInTheDocument();
  });

  it('US-26 · el COLABORADOR no ve las alertas de documentación', () => {
    mockUsuario = { id: 3, nombre: 'Franco', roles: ['COLABORADOR'] };
    renderWithProviders(<DashboardPage />);
    expect(screen.queryByRole('heading', { name: 'Alertas de documentación' })).not.toBeInTheDocument();
  });

  it('US-26 · el DELEGADO ve sus alertas al iniciar sesión y puede ir a participantes', async () => {
    const user = userEvent.setup();
    mockUsuario = { id: 4, nombre: 'Diego', roles: ['DELEGADO'] };
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Hola, Diego')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alertas de documentación' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hacerme socio/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver participantes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/participantes');
  });

  it('renderiza panel de administración para usuario ADMIN y permite navegar a módulos', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 1,
      nombre: 'Gonzalo',
      roles: ['ADMIN'],
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Hola, Gonzalo')).toBeInTheDocument();
    expect(screen.getByText(/Panel de Gestión/i)).toBeInTheDocument();
    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Participantes')).toBeInTheDocument();

    await user.click(screen.getByText('Socios'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/socios');

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/mi-club/perfil');
  });

  it.each([
    ['un socio con membresía activa', { id: 2, nombre: 'Martin', roles: ['SOCIO'], persona: { membresias: [{ id: 10, activo: true }] } }],
    ['un participante o usuario sin roles', { id: 3, nombre: 'Lucia', roles: [], persona: null }],
  ])('TASK-60 · %s tiene su inicio en Mi club', (_caso, usuario) => {
    mockUsuario = usuario;
    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/mi-club');
  });
});
