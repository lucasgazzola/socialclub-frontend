import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: { to: string; state?: { from?: string } }) => (
      <div data-testid="navigate-mock" data-from={state?.from ?? ''}>
        {to}
      </div>
    ),
    Outlet: () => <div data-testid="outlet-content">Contenido Protegido</div>,
  };
});

function renderEn(ruta: string, props: Parameters<typeof ProtectedRoute>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProtectedRoute {...props} />
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('muestra loader de verificación de sesión mientras cargando es true', () => {
    mockUseAuth.mockReturnValue({ usuario: null, cargando: true });

    renderEn('/mi-club');
    expect(screen.getByText('Verificando sesión…')).toBeInTheDocument();
  });

  it('TASK-60 · sin sesión manda al login recordando la ruta pedida (con su query)', () => {
    mockUseAuth.mockReturnValue({ usuario: null, cargando: false });

    renderEn('/mi-club/entradas?pagina=2');
    const navigate = screen.getByTestId('navigate-mock');
    expect(navigate).toHaveTextContent('/login');
    expect(navigate).toHaveAttribute('data-from', '/mi-club/entradas?pagina=2');
  });

  it('muestra mensaje de sin permisos si el usuario no tiene el rol requerido', () => {
    mockUseAuth.mockReturnValue({ usuario: { roles: ['SOCIO'] }, cargando: false });

    renderEn('/admin/usuarios', { rolesPermitidos: ['ADMIN'] });
    expect(screen.getByText('No tenés permisos para acceder a esta sección.')).toBeInTheDocument();
  });

  it('renderiza el Outlet si el usuario está autenticado y tiene rol permitido', () => {
    mockUseAuth.mockReturnValue({ usuario: { roles: ['ADMIN'] }, cargando: false });

    renderEn('/admin/usuarios', { rolesPermitidos: ['ADMIN'] });
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('TASK-60 · el panel (soloGestion) manda a Mi club a socios y participantes', () => {
    mockUseAuth.mockReturnValue({ usuario: { roles: ['SOCIO'] }, cargando: false });
    renderEn('/admin', { soloGestion: true });
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/mi-club');
  });

  it.each([['ADMIN'], ['COLABORADOR'], ['DELEGADO']])(
    'TASK-60 · el panel (soloGestion) deja pasar al rol %s',
    (rol) => {
      mockUseAuth.mockReturnValue({ usuario: { roles: [rol] }, cargando: false });
      renderEn('/admin', { soloGestion: true });
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    },
  );
});
