import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { HistorialDeportivoPage } from './HistorialDeportivoPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBuscar = vi.fn();
let mockBuscarParticipanteReturn: any = {};
vi.mock('@/features/inscripcion/hooks/useBuscarParticipante', () => ({
  useBuscarParticipante: () => mockBuscarParticipanteReturn,
}));

let mockHistorialDeportivoReturn: any = {};
vi.mock('../hooks/useHistorialDeportivo', () => ({
  useHistorialDeportivo: () => mockHistorialDeportivoReturn,
}));

describe('HistorialDeportivoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuscarParticipanteReturn = {
      participante: null,
      cargando: false,
      noEncontrado: false,
      error: null,
      buscar: mockBuscar,
    };
    mockHistorialDeportivoReturn = {
      data: null,
      isLoading: false,
    };
  });

  it('renderiza encabezado y buscador por DNI', () => {
    renderWithProviders(<HistorialDeportivoPage />);

    expect(screen.getByText('Historial de cuotas deportivas')).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar participante por DNI/i)).toBeInTheDocument();
  });

  it('muestra estado cargando cuando se busca participante y se cargan datos', () => {
    mockBuscarParticipanteReturn = {
      participante: { id: 10, nombre: 'Lucas', apellido: 'Gomez' },
      cargando: false,
      noEncontrado: false,
      error: null,
      buscar: mockBuscar,
    };
    mockHistorialDeportivoReturn = {
      data: null,
      isLoading: true,
    };

    renderWithProviders(<HistorialDeportivoPage />);

    expect(screen.getByText('Cargando historial…')).toBeInTheDocument();
  });

  it('renderiza datos del historial con pagos y períodos adeudados (con deuda)', async () => {
    const user = userEvent.setup();
    mockBuscarParticipanteReturn = {
      participante: { id: 10, nombre: 'Lucas', apellido: 'Gomez' },
      cargando: false,
      noEncontrado: false,
      error: null,
      buscar: mockBuscar,
    };
    mockHistorialDeportivoReturn = {
      data: {
        participanteNombre: 'Lucas Gomez',
        dni: '40111222',
        categoria: 'Primera',
        estadoDeuda: 'MOROSO',
        totalPagado: 15000,
        totalAdeudado: 5000,
        pagos: [
          {
            id: 1,
            disciplinaNombre: 'Fútbol',
            periodo: '2026-02',
            fechaPago: '2026-02-10T12:00:00Z',
            monto: 15000,
            registradoPor: { nombre: 'Admin User' },
          },
        ],
        adeudados: [
          {
            disciplinaId: 1,
            disciplinaNombre: 'Fútbol',
            categoriaNombre: 'Juveniles',
            periodo: '2026-03',
            monto: 5000,
            descuentoSocioPorcentaje: 10,
            inscripcionActiva: false,
          },
        ],
      },
      isLoading: false,
    };

    renderWithProviders(<HistorialDeportivoPage />);

    expect(screen.getByText('Lucas Gomez')).toBeInTheDocument();
    expect(screen.getByText('Con deuda')).toBeInTheDocument();
    expect(screen.getByText(/Juveniles/i)).toBeInTheDocument();
    expect(screen.getByText(/\(dada de baja\)/i)).toBeInTheDocument();
    expect(screen.getByText(/socio −10 %/i)).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();

    // Filtros de fecha y limpiar filtro
    const desdeInput = screen.getByLabelText('Desde');
    fireEvent.change(desdeInput, { target: { value: '01/01/2026' } });

    const limpiarBtn = screen.getByRole('button', { name: /Limpiar filtro/i });
    expect(limpiarBtn).toBeInTheDocument();
    await user.click(limpiarBtn);
    expect(desdeInput).toHaveValue('');
  });

  it('muestra estado al día y mensajes vacíos cuando no hay pagos ni deuda', () => {
    mockBuscarParticipanteReturn = {
      participante: { id: 10, nombre: 'Ana', apellido: 'Perez' },
      cargando: false,
      noEncontrado: false,
      error: null,
      buscar: mockBuscar,
    };
    mockHistorialDeportivoReturn = {
      data: {
        participanteNombre: 'Ana Perez',
        dni: null,
        categoria: null,
        estadoDeuda: 'AL_DIA',
        totalPagado: 0,
        totalAdeudado: 0,
        pagos: [],
        adeudados: [],
      },
      isLoading: false,
    };

    renderWithProviders(<HistorialDeportivoPage />);

    expect(screen.getByText('Al día')).toBeInTheDocument();
    expect(
      screen.getByText('No hay pagos registrados para el filtro seleccionado.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('El participante está al día con sus cuotas deportivas.'),
    ).toBeInTheDocument();
  });

  it('muestra cuota adeudada sin tarifa configurada', () => {
    mockBuscarParticipanteReturn = {
      participante: { id: 10, nombre: 'Ana', apellido: 'Perez' },
      cargando: false,
      noEncontrado: false,
      error: null,
      buscar: mockBuscar,
    };
    mockHistorialDeportivoReturn = {
      data: {
        participanteNombre: 'Ana Perez',
        dni: '12345678',
        categoria: 'Sub-18',
        estadoDeuda: 'MOROSO',
        totalPagado: 0,
        totalAdeudado: 0,
        pagos: [],
        adeudados: [
          {
            disciplinaId: 2,
            disciplinaNombre: 'Básquet',
            categoriaNombre: null,
            periodo: '2026-04',
            monto: null,
            descuentoSocioPorcentaje: 0,
            inscripcionActiva: true,
          },
        ],
      },
      isLoading: false,
    };

    renderWithProviders(<HistorialDeportivoPage />);

    expect(screen.getByText('Sin tarifa')).toBeInTheDocument();
  });
});

