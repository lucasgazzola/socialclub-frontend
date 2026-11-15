import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ROUTES } from '@/routes/paths';
import { PortalSocioLayout } from './PortalSocioLayout';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogout = vi.fn().mockResolvedValue(undefined);
let mockUsuario: Record<string, unknown> | null = null;

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
    logout: mockLogout,
  }),
}));

describe('PortalSocioLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsuario = {
      id: 2,
      nombre: 'Lucía',
      apellido: 'Vázquez',
      email: 'lucia.vazquez@club.local',
      roles: ['SOCIO'],
      persona: {
        id: 2,
        dni: '38111222',
        membresias: [
          {
            id: 10,
            activo: true,
            categoria: { nombre: 'Cuota General' },
            fechaAlta: '2026-01-15T00:00:00Z',
          },
        ],
      },
    };
  });

  it('muestra la identidad del socio en azul y los enlaces con chevrones del aside', () => {
    renderWithProviders(<PortalSocioLayout />);

    expect(screen.getByText('Lucía Vázquez')).toBeInTheDocument();
    expect(screen.getByText('Socio · Cuota General')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Menú del portal de socio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Inicio$/i })).toHaveAttribute('href', ROUTES.miClub);
    expect(screen.getByRole('link', { name: /Mis cuotas/i })).toHaveAttribute('href', ROUTES.misCuotas);
    expect(screen.getByRole('link', { name: /Eventos/i })).toHaveAttribute('href', ROUTES.eventos);
    expect(screen.getByRole('link', { name: /Disciplinas/i })).toHaveAttribute('href', ROUTES.solicitarInscripcion);
    expect(screen.queryByRole('link', { name: /Hacerme socio/i })).not.toBeInTheDocument();
  });

  it('permite cerrar sesión desde el botón inferior del aside', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PortalSocioLayout />);

    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    // TASK-60: al salir se vuelve a la landing (el login no recuerda la ruta anterior).
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.inicio, { replace: true });
  });
});
