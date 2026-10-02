import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { AppLayout } from './AppLayout';

const mockLogout = vi.fn();
let mockUsuario: any = null;

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
    logout: mockLogout,
  }),
}));

vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    ClubLogo: ({ size }: { size?: number }) => <div data-testid="club-logo">Logo {size}</div>,
  };
});

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUsuario = {
      id: 1,
      nombre: 'Administrador',
      apellido: 'Club',
      email: 'admin@club.com',
      roles: ['ADMIN'],
      persona: {
        membresias: [{ id: 1, activo: true }],
      },
    };
  });

  it('renderiza encabezado, usuario y enlaces de administración para ADMIN', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getAllByText('SocialClub').length).toBeGreaterThan(0);
    expect(screen.getByText('Administrador Club')).toBeInTheDocument();
    expect(screen.getAllByText('ADMIN').length).toBeGreaterThan(0);

    // Links de admin
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Disciplinas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Auditoría/i })).toBeInTheDocument();
  });

  it('permite colapsar y expandir el sidebar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout />);

    const collapseBtn = screen.getByTitle(/Contraer menú/i);
    expect(collapseBtn).toBeInTheDocument();

    await user.click(collapseBtn);
    expect(screen.getByTitle(/Expandir menú/i)).toBeInTheDocument();
    expect(localStorage.getItem('sc-sidebar-collapsed')).toBe('true');

    await user.click(screen.getByTitle(/Expandir menú/i));
    expect(screen.getByTitle(/Contraer menú/i)).toBeInTheDocument();
    expect(localStorage.getItem('sc-sidebar-collapsed')).toBe('false');
  });

  it('permite colapsar una sección de navegación del menú', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout />);

    const seccionBtn = screen.getByRole('button', { name: /Gestión Social/i });
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();

    await user.click(seccionBtn);
    expect(screen.queryByRole('link', { name: /Socios/i })).not.toBeInTheDocument();

    await user.click(seccionBtn);
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();
  });

  it('ejecuta logout al hacer clic en el botón de cerrar sesión', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout />);

    const logoutBtn = screen.getByTitle('Cerrar sesión');
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('muestra la opción "Hacerme socio" a un usuario sin membresía ni roles de gestión', () => {
    mockUsuario = {
      id: 2,
      nombre: 'Usuario',
      apellido: 'Comun',
      email: 'user@club.com',
      roles: ['USUARIO'],
      persona: null,
    };

    renderWithProviders(<AppLayout />);

    expect(screen.getByRole('link', { name: /Hacerme socio/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Auditoría/i })).not.toBeInTheDocument();
  });
});
