import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { LandingPage } from './LandingPage';

let mockUsuario: unknown = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ usuario: mockUsuario }) }));

const mockClub = vi.fn();
vi.mock('@/features/club/hooks/useClubPublico', () => ({ useClubPublico: () => mockClub() }));
const mockEventos = vi.fn();
vi.mock('@/features/eventos/hooks/useEventos', () => ({ useEventos: (p: unknown) => mockEventos(p) }));
vi.mock('@/features/entradas/components/QRCode', () => ({ QRCode: () => <div data-testid="qr" /> }));

const club = {
  planes: [
    { categoriaId: 1, nombre: 'Cuota Juvenil', descripcion: 'Hasta 17 años', cuotaMensual: 6000 },
    { categoriaId: 3, nombre: 'Cuota Senior', descripcion: null, cuotaMensual: null },
  ],
  disciplinas: [
    { id: 4, nombre: 'Natación', descripcion: 'Pileta climatizada', genero: null, edadMinima: 6, edadMaxima: null, categorias: ['Infantil'] },
  ],
  numeros: { socios: 320, participantes: 140, disciplinas: 1, eventosProximos: 2 },
};

describe('TASK-60 · Landing del club', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn() as never;
    mockUsuario = null;
    mockClub.mockReturnValue({ data: club });
    mockEventos.mockReturnValue({
      isLoading: false,
      data: {
        items: [
          { id: 12, nombre: 'Peña aniversario', estado: 'PUBLICADO', fechaEvento: '2026-12-05T23:00:00Z', lugarAcreditacion: 'Salón', precio: '2500', descuentoSocio: 15, requiereEntrada: true },
          { id: 13, nombre: 'Borrador', estado: 'BORRADOR', fechaEvento: '2026-12-06T23:00:00Z', lugarAcreditacion: 'Salón', precio: 0, descuentoSocio: 0, requiereEntrada: true },
        ],
      },
    });
  });

  it('presenta al club y lleva a asociarse o ingresar', () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Viví el club.');
    expect(screen.getAllByText(/Club Sportivo Unión de Ordóñez/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Quiero ser socio/ })[0]).toHaveAttribute('href', '/asociarme');
    expect(screen.getByRole('link', { name: 'Ya soy socio, ingresar' })).toHaveAttribute('href', '/login');
  });

  it('muestra los números reales del club', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('socios')).toBeInTheDocument();
    expect(screen.getByText('eventos por venir')).toBeInTheDocument();
  });

  it('lista disciplinas con su rango de edad y categorías', () => {
    renderWithProviders(<LandingPage />);
    const seccion = document.getElementById('disciplinas') as HTMLElement;
    expect(within(seccion).getByText('Natación')).toBeInTheDocument();
    expect(within(seccion).getByText('Desde 6 años')).toBeInTheDocument();
    expect(within(seccion).getByText('Infantil')).toBeInTheDocument();
  });

  it('muestra solo eventos publicados, con precio, descuento de socio y compra', () => {
    renderWithProviders(<LandingPage />);
    const seccion = document.getElementById('eventos') as HTMLElement;
    expect(within(seccion).getByText('Peña aniversario')).toBeInTheDocument();
    expect(within(seccion).queryByText('Borrador')).not.toBeInTheDocument();
    expect(within(seccion).getByText('15% off para socios')).toBeInTheDocument();
    expect(within(seccion).getByRole('link', { name: /Entradas/ })).toHaveAttribute('href', '/mi-club/eventos/12/entradas');
  });

  it('cada plan muestra su cuota y lleva al alta con el plan elegido', () => {
    renderWithProviders(<LandingPage />);
    const seccion = document.getElementById('planes') as HTMLElement;
    expect(within(seccion).getByText(/6\.000/)).toBeInTheDocument();
    expect(within(seccion).getByText('Consultá la cuota en secretaría')).toBeInTheDocument();
    const [primero] = within(seccion).getAllByRole('link', { name: 'Elegir este plan' });
    expect(primero).toHaveAttribute('href', '/asociarme?plan=1');
  });

  it('marca los datos de contacto como ejemplo', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('Datos de ejemplo')).toBeInTheDocument();
  });

  it('con sesión iniciada ofrece ir a Mi club (y al panel si es de gestión)', () => {
    mockUsuario = { id: 1, email: 'a@club.local', roles: ['ADMIN'] };
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByRole('link', { name: /Mi club/ })[0]).toHaveAttribute('href', '/mi-club');
    expect(screen.getByRole('link', { name: /Panel/ })).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: 'Ya soy socio, ingresar' })).not.toBeInTheDocument();
  });
});
