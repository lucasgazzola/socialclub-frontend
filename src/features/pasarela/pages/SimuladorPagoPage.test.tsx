import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SimuladorPagoPage } from './SimuladorPagoPage';
import type { OrdenPago } from '../types';

const mockObtener = vi.fn();
const mockSimular = vi.fn();
vi.mock('../api/pasarela.api', () => ({
  pasarelaApi: {
    obtener: (referencia: string) => mockObtener(referencia),
    simular: (referencia: string, aprobado: boolean) => mockSimular(referencia, aprobado),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const REF = '5f0c2c8e-7a51-4d0b-9f43-2a1b3c4d5e6f';
const orden: OrdenPago = {
  referencia: REF,
  concepto: 'ENTRADAS',
  estado: 'PENDIENTE',
  pasarela: 'SIMULADA',
  descripcion: '2 entrada(s) para "Peña"',
  monto: 3000,
  urlPago: 'http://localhost:5173/pagos/simulador',
  detalleEstado: null,
  expiraEn: '2026-11-01T00:00:00Z',
  creadoEn: '2026-10-31T23:30:00Z',
};

function renderEn(url: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <SimuladorPagoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TASK-51 · SimuladorPagoPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra la orden y avisa que es una simulación', async () => {
    mockObtener.mockResolvedValue(orden);

    renderEn(`/pagos/simulador?referencia=${REF}`);

    expect(await screen.findByText('2 entrada(s) para "Peña"')).toBeInTheDocument();
    expect(screen.getByText(/No se cobra dinero real/)).toBeInTheDocument();
    expect(screen.getByText('$3.000,00')).toBeInTheDocument();
  });

  it.each([
    ['simulador-aprobar', true],
    ['simulador-rechazar', false],
  ])('%s informa el resultado y vuelve a la página de resultado', async (boton, aprobado) => {
    const user = userEvent.setup();
    mockObtener.mockResolvedValue(orden);
    mockSimular.mockResolvedValue({ ...orden, estado: aprobado ? 'APROBADA' : 'PENDIENTE' });

    renderEn(`/pagos/simulador?referencia=${REF}`);
    await user.click(await screen.findByTestId(boton));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(`/pagos/resultado?referencia=${REF}`),
    );
    expect(mockSimular).toHaveBeenCalledWith(REF, aprobado);
  });

  it('si la simulación falla muestra el error y no navega', async () => {
    const user = userEvent.setup();
    mockObtener.mockResolvedValue(orden);
    mockSimular.mockRejectedValue(new Error('El simulador solo está disponible con la pasarela simulada'));

    renderEn(`/pagos/simulador?referencia=${REF}`);
    await user.click(await screen.findByTestId('simulador-aprobar'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'El simulador solo está disponible con la pasarela simulada',
      ),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('una orden que ya no está pendiente no se puede simular', async () => {
    mockObtener.mockResolvedValue({ ...orden, estado: 'APROBADA' });

    renderEn(`/pagos/simulador?referencia=${REF}`);

    expect(await screen.findByText(/ya no está pendiente/)).toBeInTheDocument();
    expect(screen.queryByTestId('simulador-aprobar')).not.toBeInTheDocument();
  });

  it('sin referencia o con una orden inexistente lo avisa', async () => {
    renderEn('/pagos/simulador');
    expect(screen.getByText('Falta la referencia de la orden.')).toBeInTheDocument();

    mockObtener.mockRejectedValue(new Error('Orden de pago no encontrada'));
    renderEn(`/pagos/simulador?referencia=${REF}`);
    expect(await screen.findByText('Orden de pago no encontrada')).toBeInTheDocument();
  });
});
