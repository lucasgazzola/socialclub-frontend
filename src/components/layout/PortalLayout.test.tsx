import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PortalLayout } from './PortalLayout';

const mockLogout = vi.fn();
let mockUsuario: unknown = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ usuario: mockUsuario, logout: mockLogout }),
}));

const socio = {
  id: 1,
  nombre: 'Lucía',
  apellido: 'Vázquez',
  email: 'lucia@club.local',
  roles: ['SOCIO'],
  persona: { id: 1, membresias: [{ id: 1, activo: true, categoriaId: 1, fechaAlta: '2025-01-01' }] },
};

describe('TASK-60 · PortalLayout (Mi club)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn() as never;
    mockUsuario = socio;
  });

  it('ofrece una sección por responsabilidad y marca la activa', () => {
    renderWithProviders(<PortalLayout />, { ruta: '/mi-club/entradas' });

    const [superior] = screen.getAllByRole('navigation', { name: 'Secciones de Mi club' });
    for (const seccion of ['Inicio', 'Entradas', 'Cuotas', 'Disciplinas', 'Reservas']) {
      expect(within(superior).getByRole('link', { name: seccion })).toBeInTheDocument();
    }
    expect(within(superior).getByRole('link', { name: 'Entradas' })).toHaveAttribute('aria-current', 'page');
    expect(within(superior).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('la compra de entradas cuenta como sección Entradas', () => {
    renderWithProviders(<PortalLayout />, { ruta: '/mi-club/eventos/3/entradas' });
    const [superior] = screen.getAllByRole('navigation', { name: 'Secciones de Mi club' });
    expect(within(superior).getByRole('link', { name: 'Entradas' })).toHaveAttribute('aria-current', 'page');
  });

  it('a quien nunca fue socio le ofrece asociarse en lugar de Cuotas', () => {
    mockUsuario = { ...socio, roles: [], persona: { id: 2, membresias: [] } };
    renderWithProviders(<PortalLayout />, { ruta: '/mi-club' });

    const [superior] = screen.getAllByRole('navigation', { name: 'Secciones de Mi club' });
    expect(within(superior).getByRole('link', { name: 'Asociate' })).toHaveAttribute('href', '/asociarme');
    expect(within(superior).queryByRole('link', { name: 'Cuotas' })).not.toBeInTheDocument();
  });

  it('el menú de la cuenta muestra el acceso al panel solo a roles de gestión', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PortalLayout />, { ruta: '/mi-club' });

    await user.click(screen.getByRole('button', { name: 'Menú de la cuenta' }));
    expect(screen.getByRole('menuitem', { name: /Mi perfil/ })).toHaveAttribute('href', '/mi-club/perfil');
    expect(screen.queryByRole('menuitem', { name: /panel de gestión/ })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('un delegado socio puede saltar al panel y cerrar sesión desde el menú', async () => {
    const user = userEvent.setup();
    mockUsuario = { ...socio, roles: ['DELEGADO', 'SOCIO'] };
    renderWithProviders(<PortalLayout />, { ruta: '/mi-club' });

    await user.click(screen.getByRole('button', { name: 'Menú de la cuenta' }));
    expect(screen.getByRole('menuitem', { name: /panel de gestión/ })).toHaveAttribute('href', '/admin');

    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
    expect(mockLogout).toHaveBeenCalled();
  });
});
