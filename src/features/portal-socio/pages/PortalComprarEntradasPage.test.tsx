import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { PortalComprarEntradasPage } from './PortalComprarEntradasPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ eventoId: '1' }),
  useNavigate: () => vi.fn(),
}));
let mockUsuario: unknown = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ usuario: mockUsuario }) }));
vi.mock('@/features/eventos/hooks/useEventos', () => ({
  useEvento: () => ({
    data: {
      id: 1,
      nombre: 'Cena',
      descripcion: null,
      precio: '6000',
      descuentoSocio: 10,
      entradasDisponibles: 50,
      estado: 'PUBLICADO',
      fechaEvento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requiereEntrada: true,
    },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('@/features/entradas/hooks/useEntradas', () => ({
  useIniciarCompraEntradas: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('TASK-60 · H02 · Comprar entradas en el portal', () => {
  beforeEach(() => {
    mockUsuario = null;
  });

  it('al socio le muestra el precio con su descuento, igual que lo que cobra la pasarela', () => {
    mockUsuario = { id: 1, email: 's@club', roles: ['SOCIO'], persona: { id: 1, membresias: [] } };
    renderWithProviders(<PortalComprarEntradasPage />);
    expect(screen.getByTestId('precio-unitario')).toHaveTextContent('5.400,00');
    expect(screen.getByTestId('descuento-socio')).toHaveTextContent('10% socio');
  });

  it('a quien no es socio le muestra el precio de lista', () => {
    mockUsuario = { id: 2, email: 'v@club', roles: [], persona: { id: 2, membresias: [] } };
    renderWithProviders(<PortalComprarEntradasPage />);
    expect(screen.getByTestId('precio-unitario')).toHaveTextContent('6.000,00');
    expect(screen.queryByTestId('descuento-socio')).not.toBeInTheDocument();
  });
});
