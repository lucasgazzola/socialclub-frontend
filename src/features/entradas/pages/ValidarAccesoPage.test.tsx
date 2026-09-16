import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ValidarAccesoPage } from './ValidarAccesoPage';
import { entradasApi } from '../api/entradas.api';

/**
 * La página toma el evento de la ruta (`/eventos/:eventoId/validar`) y, si no
 * lo tiene, muestra primero la pantalla de selección. Para llegar al escáner
 * hay que entrar con el parámetro y tener el evento en la lista, así que se
 * mockea `useEventos`: sin eso la página se queda en "No se encontraron
 * eventos" y ningún control del escáner existe en el DOM.
 */
const EVENTO = {
  id: 1,
  nombre: 'Torneo Nocturno de Pádel',
  descripcion: 'Evento de prueba',
  entradasDisponibles: 50,
  entradasVendidas: 10,
  creadoEn: '2026-09-01T00:00:00.000Z',
};

vi.mock('@/features/eventos/hooks/useEventos', () => ({
  useEventos: () => ({ data: [EVENTO], isLoading: false, isError: false }),
  eventosKeys: { all: ['eventos'], list: () => ['eventos', 'list'] },
}));

vi.mock('../api/entradas.api', () => ({
  entradasApi: {
    validarEntrada: vi.fn(),
  },
}));

// Mock de html5-qrcode para evitar errores de cámara en entorno JSDOM de vitest
vi.mock('html5-qrcode', () => {
  return {
    Html5QrcodeSupportedFormats: { QR_CODE: 0 },
    Html5Qrcode: Object.assign(
      vi.fn().mockImplementation(() => ({
        start: vi.fn().mockResolvedValue(true),
        stop: vi.fn().mockResolvedValue(true),
        scanFile: vi.fn(),
      })),
      {
        getCameras: vi.fn().mockResolvedValue([]),
      },
    ),
  };
});


describe('ValidarAccesoPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/eventos/${EVENTO.id}/validar`]}>
          <Routes>
            <Route path="/eventos/:eventoId/validar" element={<ValidarAccesoPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('renders the header and scanner options', () => {
    renderComponent();
    // Con el evento en la ruta, la página va directo al panel de control:
    // "Validación de Acceso por QR" es el título de la pantalla de selección.
    expect(screen.getByText(`Control de Acceso: ${EVENTO.nombre}`)).toBeInTheDocument();
    expect(screen.getByText('Escáner de Cámara')).toBeInTheDocument();
    expect(screen.getByText('Ingreso Manual / Archivo')).toBeInTheDocument();
  });

  it('allows manual token submission and shows ACCESO PERMITIDO on success', async () => {
    const mockSuccessResponse = {
      acceso: 'PERMITIDO' as const,
      entrada: {
        id: 10,
        eventoId: EVENTO.id,
        eventoNombre: EVENTO.nombre,
      },
    };
    vi.mocked(entradasApi.validarEntrada).mockResolvedValueOnce(mockSuccessResponse);

    renderComponent();

    // Cambiar a pestaña manual
    fireEvent.click(screen.getByText('Ingreso Manual / Archivo'));

    // Ingresar token UUID
    const input = screen.getByLabelText(/Token UUID de la Entrada/i);
    fireEvent.change(input, { target: { value: '550e8400-e29b-41d4-a716-446655440000' } });

    // Enviar formulario
    const submitBtn = screen.getByText('Validar Token Manualmente');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('¡ACCESO PERMITIDO!')).toBeInTheDocument();
      expect(screen.getByText('Evento: Torneo Nocturno de Pádel')).toBeInTheDocument();
    });
  });

  it('shows error banner when ticket was already used (409 Conflict)', async () => {
    const mockConflictError = {
      response: {
        status: 409,
        data: {
          message: 'Entrada ya utilizada para el evento "Fiesta de Fin de Año". Posible intento de reingreso no autorizado.',
        },
      },
    };
    vi.mocked(entradasApi.validarEntrada).mockRejectedValueOnce(mockConflictError);

    renderComponent();

    fireEvent.click(screen.getByText('Ingreso Manual / Archivo'));
    const input = screen.getByLabelText(/Token UUID de la Entrada/i);
    fireEvent.change(input, { target: { value: '550e8400-e29b-41d4-a716-446655440000' } });

    const submitBtn = screen.getByText('Validar Token Manualmente');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('¡ENTRADA YA UTILIZADA!')).toBeInTheDocument();
      expect(screen.getByText('⛔ Posible intento de reingreso no autorizado.')).toBeInTheDocument();
    });
  });

  it('detects when a ticket corresponds to a different event than selected', async () => {
    const mockSuccessResponse = {
      acceso: 'PERMITIDO' as const,
      entrada: {
        id: 10,
        eventoId: 99,
        eventoNombre: 'Torneo de Pádel',
      },
    };
    vi.mocked(entradasApi.validarEntrada).mockResolvedValueOnce(mockSuccessResponse);

    // El evento que se controla sale de la ruta (EVENTO.id = 1) y la entrada
    // escaneada pertenece al 99, así que tiene que detectarse el desvío.
    renderComponent();

    fireEvent.click(screen.getByText('Ingreso Manual / Archivo'));
    const input = screen.getByLabelText(/Token UUID de la Entrada/i);
    fireEvent.change(input, { target: { value: '550e8400-e29b-41d4-a716-446655440000' } });

    const submitBtn = screen.getByText('Validar Token Manualmente');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('¡ENTRADA DE OTRO EVENTO!')).toBeInTheDocument();
      expect(
        screen.getByText(/Esta entrada es válida, pero no corresponde a este evento/i),
      ).toBeInTheDocument();
    });
  });
});

