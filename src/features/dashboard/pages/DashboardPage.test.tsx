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
    expect(mockNavigate).toHaveBeenCalledWith('/participantes');
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
    expect(mockNavigate).toHaveBeenCalledWith('/socios');

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('renderiza panel de socio cuando tiene membresía activa', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 2,
      nombre: 'Martin',
      roles: ['SOCIO'],
      persona: {
        dni: '38111222',
        membresias: [
          {
            id: 10,
            activo: true,
            categoria: { nombre: 'Pleno' },
            fechaAlta: '2026-01-15T00:00:00Z',
          },
        ],
      },
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Membresía Activa')).toBeInTheDocument();
    expect(screen.getByText(/Hola, Martin/i)).toBeInTheDocument();
    expect(screen.getByText('Pleno')).toBeInTheDocument();
    expect(screen.getByText('38111222')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Editar mis datos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('renderiza pantalla neutra con invitación a ser socio si no tiene roles ni membresía', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 3,
      nombre: 'Lucia',
      roles: ['USUARIO'],
      persona: null,
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Sumate al club')).toBeInTheDocument();

    const hacermeSocioBtn = screen.getByRole('button', { name: /Hacerme socio/i });
    await user.click(hacermeSocioBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/hacerme-socio');
  });
});
