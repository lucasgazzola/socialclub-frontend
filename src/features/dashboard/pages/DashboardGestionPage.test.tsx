import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { DashboardMetricas } from '../types/dashboard.types';
import { DashboardGestionPage } from './DashboardGestionPage';

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

const mockRefetch = vi.fn();
const mockUseDashboard = vi.fn();
vi.mock('../hooks/useDashboard', () => ({
  useDashboard: (enabled?: boolean) => mockUseDashboard(enabled),
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

describe('DashboardGestionPage (/dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      data: METRICAS_MOCK,
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: new Date('2026-11-08T17:30:00.000Z').getTime(), // 14:30 UTC-3
      refetch: mockRefetch,
    });
  });

  it('renderiza las 4 tarjetas KPI, los 2 gráficos, tabla de próximos eventos y controles para ADMIN', async () => {
    const user = userEvent.setup();
    mockUsuario = {
      id: 1,
      nombre: 'Gonzalo',
      roles: ['ADMIN'],
    };

    renderWithProviders(<DashboardGestionPage />);

    expect(screen.getByRole('heading', { name: 'Dashboard de Gestión' })).toBeInTheDocument();
    expect(screen.getByText(/Última actualización: 14:30/i)).toBeInTheDocument();

    // 4 KPIs
    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('150');
    expect(screen.getByTestId('kpi-porcentaje-morosos')).toHaveTextContent('12.0%');
    expect(screen.getByTestId('semaforo-morosidad')).toHaveAttribute('data-nivel', 'verde');
    expect(screen.getByTestId('kpi-documentos-por-vencer')).toHaveTextContent('7');
    expect(screen.getByTestId('kpi-inscripciones-irregulares')).toHaveTextContent('5');

    // Gráficos con etiqueta y valor
    expect(screen.getByTestId('grafico-morosidad')).toBeInTheDocument();
    expect(screen.getByTestId('resumen-morosidad-al-dia')).toHaveTextContent('132 (88.0%)');
    expect(screen.getByTestId('resumen-morosidad-morosos')).toHaveTextContent('18 (12.0%)');
    expect(screen.getByTestId('grafico-inscripciones')).toBeInTheDocument();
    expect(screen.getByTestId('resumen-inscripciones-pendientes')).toHaveTextContent('3');
    expect(screen.getByTestId('resumen-inscripciones-bloqueadas')).toHaveTextContent('2');

    // Tabla de Próximos Eventos
    expect(screen.getAllByText('Torneo Aniversario').length).toBeGreaterThanOrEqual(1);
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

    await user.click(screen.getByText('Inscripciones Irregulares'));
    expect(mockNavigate).toHaveBeenCalledWith('/participantes');
  });

  it('permite el acceso al rol COLABORADOR y muestra todas las métricas y gráficos', () => {
    mockUsuario = {
      id: 3,
      nombre: 'Franco',
      roles: ['COLABORADOR'],
    };

    renderWithProviders(<DashboardGestionPage />);

    expect(mockUseDashboard).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('150');
    expect(screen.getByTestId('grafico-morosidad')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-inscripciones')).toBeInTheDocument();
  });

  it('muestra semáforo amarillo (15-30%) y rojo (>30%) según el porcentaje de morosidad', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };

    mockUseDashboard.mockReturnValueOnce({
      data: { ...METRICAS_MOCK, porcentajeMorosos: 22.5, cantidadMorosos: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: mockRefetch,
    });

    const { unmount } = renderWithProviders(<DashboardGestionPage />);
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

    renderWithProviders(<DashboardGestionPage />);
    expect(screen.getByTestId('semaforo-morosidad')).toHaveAttribute('data-nivel', 'rojo');
  });

  it('maneja organización con 0 integrantes activos (0.0%), gráficos vacíos y lista de eventos vacía', () => {
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

    renderWithProviders(<DashboardGestionPage />);

    expect(screen.getByTestId('kpi-integrantes-activos')).toHaveTextContent('0');
    expect(screen.getByTestId('kpi-porcentaje-morosos')).toHaveTextContent('0.0%');
    expect(screen.getByTestId('grafico-morosidad-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-inscripciones-vacio')).toBeInTheDocument();
    expect(
      screen.getByText('No hay eventos próximos programados o publicados en la organización'),
    ).toBeInTheDocument();
  });

  it('muestra skeleton loader durante la carga inicial', () => {
    mockUsuario = { id: 1, nombre: 'Gonzalo', roles: ['ADMIN'] };
    mockUseDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      dataUpdatedAt: 0,
      refetch: mockRefetch,
    });

    renderWithProviders(<DashboardGestionPage />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('muestra mensaje de error y botón Reintentar carga cuando falla la petición', async () => {
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

    renderWithProviders(<DashboardGestionPage />);

    expect(
      screen.getByText(
        'No se pudieron cargar las métricas del dashboard. Por favor, reintente en unos minutos.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reintentar carga/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('redirige a /mi-perfil con mensaje de falta de permisos si un SOCIO intenta acceder a /dashboard', () => {
    mockUsuario = {
      id: 2,
      nombre: 'Martin',
      roles: ['SOCIO'],
    };

    renderWithProviders(<DashboardGestionPage />);

    expect(mockUseDashboard).toHaveBeenCalledWith(false);
    expect(
      screen.getByText('No posee permisos para acceder al dashboard de gestión de la organización'),
    ).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/mi-perfil', { replace: true });
  });

  it('redirige a /mi-perfil con mensaje de falta de permisos si un DELEGADO intenta acceder a /dashboard', () => {
    mockUsuario = {
      id: 4,
      nombre: 'Diego',
      roles: ['DELEGADO'],
    };

    renderWithProviders(<DashboardGestionPage />);

    expect(mockUseDashboard).toHaveBeenCalledWith(false);
    expect(
      screen.getByText('No posee permisos para acceder al dashboard de gestión de la organización'),
    ).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/mi-perfil', { replace: true });
  });

  it('redirige a /login si un usuario anónimo intenta acceder a /dashboard', () => {
    mockUsuario = null;

    renderWithProviders(<DashboardGestionPage />);

    expect(mockUseDashboard).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
