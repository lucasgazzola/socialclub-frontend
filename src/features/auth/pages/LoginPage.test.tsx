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

  it('redirige a / cuando ya hay sesión iniciada', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: { id: 1, email: 'user@test.com' },
    } as never);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
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

    expect(screen.getByText('Ingresá con tu cuenta administrativa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrate/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
