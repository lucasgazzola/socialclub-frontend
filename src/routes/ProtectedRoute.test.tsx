import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
    Outlet: () => <div data-testid="outlet-content">Contenido Protegido</div>,
  };
});

describe('ProtectedRoute', () => {
  it('muestra loader de verificación de sesión mientras cargando es true', () => {
    mockUseAuth.mockReturnValue({
      usuario: null,
      cargando: true,
    });

    render(<ProtectedRoute />);
    expect(screen.getByText('Verificando sesión…')).toBeInTheDocument();
  });

  it('redirige a login si no hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({
      usuario: null,
      cargando: false,
    });

    render(<ProtectedRoute />);
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/login');
  });

  it('muestra mensaje de sin permisos si el usuario no tiene el rol requerido', () => {
    mockUseAuth.mockReturnValue({
      usuario: { roles: ['SOCIO'] },
      cargando: false,
    });

    render(<ProtectedRoute rolesPermitidos={['ADMIN']} />);
    expect(screen.getByText('No tenés permisos para acceder a esta sección.')).toBeInTheDocument();
  });

  it('renderiza el Outlet si el usuario está autenticado y tiene rol permitido', () => {
    mockUseAuth.mockReturnValue({
      usuario: { roles: ['ADMIN'] },
      cargando: false,
    });

    render(<ProtectedRoute rolesPermitidos={['ADMIN']} />);
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });
});
