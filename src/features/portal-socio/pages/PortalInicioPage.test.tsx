import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ROUTES } from '@/routes/paths';
import { PortalInicioPage } from './PortalInicioPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockUsuario: Record<string, unknown> | null = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
  }),
}));

describe('PortalInicioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la billetera digital de socio activo, ficha de datos y accesos del club', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 2,
      nombre: 'Lucía',
      apellido: 'Vázquez',
      email: 'lucia@club.com',
      roles: ['SOCIO'],
      persona: {
        dni: '38111222',
        telefono: '3534000111',
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

    renderWithProviders(<PortalInicioPage />);

    expect(screen.getByRole('heading', { name: 'Hola, Lucía' })).toBeInTheDocument();
    expect(screen.getByText('Membresía Activa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vázquez, Lucía' })).toBeInTheDocument();
    expect(screen.getByText('DNI 38.111.222')).toBeInTheDocument();
    expect(screen.getByText('38.111.222')).toBeInTheDocument();
    expect(screen.getByText('Cuota General')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /VER MIS CUOTAS/i }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.misCuotas);

    await user.click(screen.getByRole('button', { name: /Reservar espacio/i }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.misReservas);
  });

  it('muestra estado de participante y CTA para hacerse socio cuando no posee membresía', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 9,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@club.com',
      roles: ['USUARIO'],
      persona: null,
    };

    renderWithProviders(<PortalInicioPage />);

    expect(screen.getByText('Sumate al club')).toBeInTheDocument();
    expect(screen.getByText('Participante')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /QUIERO HACERME SOCIO/i }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.hacermeSocio);
  });
});
