import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { RegisterPage } from './RegisterPage';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

let mockUser: any = null;
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUser,
  }),
}));

vi.mock('../components/RegisterForm', () => ({
  RegisterForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="register-form-mock">
      <button onClick={onSuccess}>Simular Éxito Registro</button>
    </div>
  ),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  it('redirige al dashboard si ya hay un usuario autenticado', () => {
    mockUser = { id: 1, email: 'user@club.com' };

    renderWithProviders(<RegisterPage />);
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('/');
  });

  it('renderiza el formulario de registro y link al login si no hay sesión', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByText('Creá tu cuenta')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-mock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Iniciá sesión/i })).toBeInTheDocument();
  });

  it('notifica con toast y redirige a login tras registro exitoso', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: 'Simular Éxito Registro' }));

    expect(toast.success).toHaveBeenCalledWith(
      'Cuenta creada. Iniciá sesión con tus credenciales.',
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
