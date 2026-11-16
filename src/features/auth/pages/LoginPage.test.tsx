import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button type="button" onClick={onSuccess}>
      Simular Login Exitoso
    </button>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLogin(state?: unknown) {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Panel</div>} />
          <Route path="/mi-club" element={<div>Mi club</div>} />
          <Route path="/mi-club/entradas" element={<div>Mis entradas</div>} />
          <Route path="/asociarme" element={<div>Asociarme</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('TASK-60 · con sesión, un rol de gestión entra al panel', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: { id: 1, email: 'a@test.com', roles: ['COLABORADOR'] } } as never);
    renderLogin();
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  it('TASK-60 · con sesión, un socio o participante entra a Mi club', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: { id: 2, email: 's@test.com', roles: ['SOCIO'] } } as never);
    renderLogin();
    expect(screen.getByText('Mi club')).toBeInTheDocument();
  });

  it('TASK-60 · vuelve a la ruta que se pidió antes de ingresar', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: { id: 2, email: 's@test.com', roles: [] } } as never);
    renderLogin({ from: '/mi-club/entradas' });
    expect(screen.getByText('Mis entradas')).toBeInTheDocument();
  });

  it('TASK-60 · ignora un destino externo armado en el estado', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: { id: 2, email: 's@test.com', roles: [] } } as never);
    renderLogin({ from: '//sitio-malicioso.com' });
    expect(screen.getByText('Mi club')).toBeInTheDocument();
  });

  it('TASK-60 · retoma el alta de socio que quedó pendiente al verificar el email', () => {
    localStorage.setItem('sc-volver-a', JSON.stringify({ ruta: '/asociarme?plan=2', hasta: Date.now() + 60_000 }));
    vi.mocked(useAuth).mockReturnValue({ usuario: { id: 2, email: 's@test.com', roles: [] } } as never);
    renderLogin();
    expect(screen.getByText('Asociarme')).toBeInTheDocument();
    expect(localStorage.getItem('sc-volver-a')).toBeNull();
  });

  it('renderiza el formulario de login y enlace a registro cuando no hay sesión', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: null,
    } as never);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ingresá a Mi club o al panel de gestión')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrate/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
