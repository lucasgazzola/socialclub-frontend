import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
    } as never);
  });

  it('valida campos requeridos y formato de email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={mockOnSuccess} />);

    await user.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ingresá un email válido/i)).toBeInTheDocument();
      expect(screen.getByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('muestra error del servidor cuando login rechaza', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Credenciales incorrectas'));

    render(<LoginForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/Email/i), 'admin@club.com');
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123');

    await user.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('llama a login y luego a onSuccess con credenciales válidas', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText(/Email/i), 'admin@club.com');
    await user.type(screen.getByLabelText(/Contraseña/i), 'password123');

    await user.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@club.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
