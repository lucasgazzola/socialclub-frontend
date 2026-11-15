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
    renderWithProviders(<AppLayout />, { ruta: '/admin' });

    expect(screen.getAllByText('SocialClub').length).toBeGreaterThan(0);
    expect(screen.getByText('Administrador Club')).toBeInTheDocument();
    expect(screen.getAllByText('ADMIN').length).toBeGreaterThan(0);

    // Encabezado superior
    expect(screen.getByRole('heading', { name: /Panel de Inicio/i })).toBeInTheDocument();

    // Links de admin
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Disciplinas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Auditoría/i })).toBeInTheDocument();
  });

  it('permite colapsar y expandir el sidebar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout />, { ruta: '/admin' });

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
    renderWithProviders(<AppLayout />, { ruta: '/admin' });

    const seccionBtn = screen.getByRole('button', { name: /Gestión Social/i });
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();

    await user.click(seccionBtn);
    expect(screen.queryByRole('link', { name: /Socios/i })).not.toBeInTheDocument();

    await user.click(seccionBtn);
    expect(screen.getByRole('link', { name: /Socios/i })).toBeInTheDocument();
  });

  it('ejecuta logout al hacer clic en el botón de cerrar sesión', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppLayout />, { ruta: '/admin' });

    const logoutBtn = screen.getByTitle('Cerrar sesión');
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('TASK-60 · lo personal vive en Mi club: el menú no lo lista y el encabezado lleva a Mi club', () => {
    renderWithProviders(<AppLayout />, { ruta: '/admin' });

    expect(screen.getByRole('link', { name: /^Mi club$/i })).toHaveAttribute('href', '/mi-club');
    for (const personal of [/Mis cuotas/i, /Mis entradas/i, /Mis reservas/i, /Mi perfil/i, /Hacerme socio/i]) {
      expect(screen.queryByRole('link', { name: personal })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /^Eventos$/i })).toHaveAttribute('href', '/admin/eventos');
  });

  it('US-34 · muestra la entrada "Dashboard" en el menú lateral para ADMIN y COLABORADOR', () => {
    mockUsuario = {
      id: 1,
      nombre: 'Admin',
      apellido: 'Uno',
      email: 'admin@club.com',
      roles: ['ADMIN'],
      persona: null,
    };

    const { unmount } = renderWithProviders(<AppLayout />, { ruta: '/admin' });
    const linkAdmin = screen.getByRole('link', { name: /^Dashboard$/i });
    expect(linkAdmin).toBeInTheDocument();
    expect(linkAdmin).toHaveAttribute('href', '/admin/dashboard');
    unmount();

    mockUsuario = {
      id: 3,
      nombre: 'Colaborador',
      apellido: 'Uno',
      email: 'colab@club.com',
      roles: ['COLABORADOR'],
      persona: null,
    };

    renderWithProviders(<AppLayout />, { ruta: '/admin' });
    const linkColab = screen.getByRole('link', { name: /^Dashboard$/i });
    expect(linkColab).toBeInTheDocument();
    expect(linkColab).toHaveAttribute('href', '/admin/dashboard');
  });

  it('US-34 · oculta la entrada "Dashboard" para DELEGADO y SOCIO', () => {
    mockUsuario = {
      id: 4,
      nombre: 'Delegado',
      apellido: 'Uno',
      email: 'delegado@club.com',
      roles: ['DELEGADO'],
      persona: null,
    };

    const { unmount } = renderWithProviders(<AppLayout />, { ruta: '/admin' });
    expect(screen.queryByRole('link', { name: /^Dashboard$/i })).not.toBeInTheDocument();
    unmount();

    mockUsuario = {
      id: 2,
      nombre: 'Socio',
      apellido: 'Uno',
      email: 'socio@club.com',
      roles: ['SOCIO'],
      persona: { membresias: [{ id: 1, activo: true }] },
    };

    renderWithProviders(<AppLayout />, { ruta: '/admin' });
    expect(screen.queryByRole('link', { name: /^Dashboard$/i })).not.toBeInTheDocument();
  });
});
