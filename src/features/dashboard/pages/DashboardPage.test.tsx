import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '@/test/test-utils';
import type { DashboardMetricas } from '../types/dashboard.types';
import { DashboardPage } from './DashboardPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockUsuario: any = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: mockUsuario,
  }),
}));

const mockAlertas = vi.fn();
vi.mock('@/features/documentacion/hooks/useDocumentacion', () => ({
  useAlertasDocumentacion: () => mockAlertas(),
}));

const mockRefetch = vi.fn();
const mockUseDashboard = vi.fn();
vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}));

const METRICAS_MOCK: DashboardMetricas = {
  totalIntegrantesActivos: 150,
  porcentajeMorosos: 12,
  cantidadMorosos: 18,
  documentosPorVencer: 7,
  inscripcionesIrregulares: {
    total: 5,
    pendientes: 3,
    bloqueadas: 2,
  },
  proximosEventos: [
    {
      id: 1,
      nombre: 'Torneo Aniversario',
      fechaEvento: '2026-11-20T21:00:00.000Z', // 18:00 en Córdoba (UTC-3)
      fechaFin: '2026-11-21T02:00:00.000Z',
      lugarAcreditacion: 'Sede Central',
      capacidadMaxima: 100,
      entradasDisponibles: 25,
      entradasVendidas: 75,
    },
    {
      id: 2,
      nombre: 'Jornada Recreativa',
      fechaEvento: '2026-11-25T13:30:00.000Z', // 10:30 en Córdoba (UTC-3)
      fechaFin: null,
      lugarAcreditacion: 'Predio Deportivo',
      capacidadMaxima: null,
      entradasDisponibles: null,
      entradasVendidas: 0,
    },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlertas.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockUseDashboard.mockReturnValue({
      data: METRICAS_MOCK,
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: new Date('2026-11-08T17:30:00.000Z').getTime(), // 14:30 UTC-3
      refetch: mockRefetch,
    });
  });

  it('US-26 · el ADMIN ve las alertas de documentación en el Inicio', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('heading', { name: 'Alertas de documentación' })).toBeInTheDocument();
  });

  it('US-26 · el COLABORADOR no ve las alertas de documentación pero sí el dashboard', () => {
    mockUsuario = { id: 3, nombre: 'Franco', roles: ['COLABORADOR'] };
    renderWithProviders(<DashboardPage />);
    expect(
      screen.queryByRole('heading', { name: 'Alertas de documentación' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('150');
  });

  it('US-26 · el DELEGADO ve sus alertas al iniciar sesión y puede ir a participantes', async () => {
    const user = userEvent.setup();
    mockUsuario = { id: 4, nombre: 'Diego', roles: ['DELEGADO'] };
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Hola, Diego')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alertas de documentación' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hacerme socio/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver participantes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/participantes');
  });

  it('US-34 · renderiza las 4 tarjetas KPI, tabla de próximos eventos, última actualización y navegación', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 1,
      nombre: 'Gonzalo',
      roles: ['ADMIN'],
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Hola, Gonzalo')).toBeInTheDocument();
    expect(screen.getByText(/Última actualización: 14:30/i)).toBeInTheDocument();

    // 4 KPIs
    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('150');
    expect(screen.getByTestId('kpi-porcentaje-morosos')).toHaveTextContent('12.0%');
    expect(screen.getByText(/18 personas morosas sobre 150 activos/i)).toBeInTheDocument();
    expect(screen.getByTestId('semaforo-morosidad')).toHaveAttribute('data-nivel', 'verde');
    expect(screen.getByTestId('kpi-documentos-por-vencer')).toHaveTextContent('7');
    expect(screen.getByTestId('kpi-inscripciones-irregulares')).toHaveTextContent('5');
    expect(screen.getByText('Pendientes: 3')).toBeInTheDocument();
    expect(screen.getByText('Bloqueadas: 2')).toBeInTheDocument();

    // Tabla de Próximos Eventos
    expect(screen.getByText('Torneo Aniversario')).toBeInTheDocument();
    expect(screen.getByText('20/11/2026 18:00')).toBeInTheDocument();
    expect(screen.getByText('Sede Central')).toBeInTheDocument();
    expect(screen.getByText(/75 \/ 100 vendidas/i)).toBeInTheDocument();
    expect(screen.getByText('25 disponibles')).toBeInTheDocument();
    expect(screen.getByText('Jornada Recreativa')).toBeInTheDocument();
    expect(screen.getByText('Sin límite de cupo')).toBeInTheDocument();

    // Botón Actualizar
    await user.click(screen.getByRole('button', { name: /Actualizar/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    // Navegación desde tarjetas KPI a rutas existentes
    await user.click(screen.getByText('Total de Integrantes Activos'));
    expect(mockNavigate).toHaveBeenCalledWith('/socios');

    await user.click(screen.getByText('Porcentaje de Morosos'));
    expect(mockNavigate).toHaveBeenCalledWith('/cuotas/social/morosos');

    await user.click(screen.getByText('Documentos por Vencer'));
    expect(mockNavigate).toHaveBeenCalledWith('/participantes');

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('US-34 · muestra semáforo amarillo (15-30%) y rojo (>30%) según el porcentaje de morosidad', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };

    mockUseDashboard.mockReturnValueOnce({
      data: { ...METRICAS_MOCK, porcentajeMorosos: 22.5 },
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: mockRefetch,
    });

    const { unmount } = renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('semaforo-morosidad')).toHaveAttribute('data-nivel', 'amarillo');
    unmount();

    mockUseDashboard.mockReturnValueOnce({
      data: { ...METRICAS_MOCK, porcentajeMorosos: 45.2 },
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('semaforo-morosidad')).toHaveAttribute('data-nivel', 'rojo');
  });

  it('US-34 · maneja organización con 0 integrantes activos (0.0%) y lista de eventos vacía', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    mockUseDashboard.mockReturnValue({
      data: {
        totalIntegrantesActivos: 0,
        porcentajeMorosos: 0,
        cantidadMorosos: 0,
        documentosPorVencer: 0,
        inscripcionesIrregulares: { total: 0, pendientes: 0, bloqueadas: 0 },
        proximosEventos: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('0');
    expect(screen.getByTestId('kpi-porcentaje-morosos')).toHaveTextContent('0.0%');
    expect(
      screen.getByText('No hay eventos próximos programados o publicados en la organización'),
    ).toBeInTheDocument();
  });

  it('US-34 · muestra skeleton loader durante la carga inicial', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      dataUpdatedAt: 0,
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('US-34 · muestra mensaje de error y botón Reintentar carga cuando falla la petición', async () => {
    const user = userEvent.setup();
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      dataUpdatedAt: 0,
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardPage />);

    expect(
      screen.getByText(
        'No se pudieron cargar las métricas del dashboard. Por favor, reintente en unos minutos.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reintentar carga/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('US-34 · redirige a /mi-perfil si un SOCIO intenta acceder directamente a /dashboard', () => {
    mockUsuario = {
      id: 2,
      nombre: 'Martin',
      roles: ['SOCIO'],
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText('No posee permisos para acceder al dashboard de gestión de la organización'),
    ).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/mi-perfil', { replace: true });
  });

  it('renderiza panel de socio cuando tiene membresía activa en la ruta de inicio', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 2,
      nombre: 'Martin',
      roles: ['SOCIO'],
      persona: {
        dni: '38111222',
        membresias: [
          {
            id: 10,
            activo: true,
            categoria: { nombre: 'Pleno' },
            fechaAlta: '2026-01-15T00:00:00Z',
          },
        ],
      },
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Membresía Activa')).toBeInTheDocument();
    expect(screen.getByText(/Hola, Martin/i)).toBeInTheDocument();
    expect(screen.getByText('Pleno')).toBeInTheDocument();
    expect(screen.getByText('38.111.222')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Editar mis datos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('renderiza pantalla neutra con invitación a ser socio si no tiene roles ni membresía', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 3,
      nombre: 'Lucia',
      roles: ['USUARIO'],
      persona: null,
    };

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Sumate al club')).toBeInTheDocument();

    const hacermeSocioBtn = screen.getByRole('button', { name: /Hacerme socio/i });
    await user.click(hacermeSocioBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/hacerme-socio');
  });
});
