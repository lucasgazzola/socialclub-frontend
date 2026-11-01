import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultadoPagoPage } from './ResultadoPagoPage';
import type { OrdenPago } from '../types';

const mockConfirmar = vi.fn();
const mockCancelar = vi.fn();
vi.mock('../api/pasarela.api', () => ({
  pasarelaApi: {
    confirmar: (referencia: string, idPago?: string) => mockConfirmar(referencia, idPago),
    cancelar: (referencia: string) => mockCancelar(referencia),
  },
}));

const mockAssign = vi.fn();
vi.stubGlobal('location', { ...window.location, assign: mockAssign });

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const REF = '5f0c2c8e-7a51-4d0b-9f43-2a1b3c4d5e6f';

function orden(extra: Partial<OrdenPago> = {}): OrdenPago {
  return {
    referencia: REF,
    concepto: 'CUOTA_SOCIAL',
    estado: 'PENDIENTE',
    pasarela: 'MERCADO_PAGO',
    descripcion: 'Cuota social 2026-10',
    monto: 12000,
    urlPago: 'https://mp/checkout',
    detalleEstado: null,
    expiraEn: '2026-11-01T00:00:00Z',
    creadoEn: '2026-10-31T23:30:00Z',
    ...extra,
  };
}

function renderEn(url: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <ResultadoPagoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TASK-51 · ResultadoPagoPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin referencia avisa que no encontró el pago', () => {
    renderEn('/pagos/resultado');
    expect(screen.getByText('No encontramos el pago')).toBeInTheDocument();
    expect(mockConfirmar).not.toHaveBeenCalled();
  });

  it('TC-259 · confirma con el payment_id que agrega Mercado Pago y muestra el pago aprobado', async () => {
    mockConfirmar.mockResolvedValue(orden({ estado: 'APROBADA', urlPago: null }));

    renderEn(`/pagos/resultado?referencia=${REF}&payment_id=999&status=approved`);

    expect(await screen.findByTestId('pago-aprobado')).toBeInTheDocument();
    expect(mockConfirmar).toHaveBeenCalledWith(REF, '999');
    expect(screen.getByText(/Cuota social 2026-10 · \$12\.000,00/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis cuotas' })).toHaveAttribute('href', '/mis-cuotas');
  });

  it('una compra de entradas aprobada lleva a «Mis entradas»', async () => {
    mockConfirmar.mockResolvedValue(orden({ estado: 'APROBADA', concepto: 'ENTRADAS', urlPago: null }));

    renderEn(`/pagos/resultado?referencia=${REF}`);

    expect(await screen.findByRole('link', { name: 'Ver mis entradas' })).toHaveAttribute(
      'href',
      '/mis-entradas',
    );
    // Sin payment_id (o con "null", como manda MP al desistir) busca por la referencia.
    expect(mockConfirmar).toHaveBeenCalledWith(REF, undefined);
  });

  it('TC-260 · un pago rechazado permite volver a la pasarela o cancelar', async () => {
    const user = userEvent.setup();
    mockConfirmar.mockResolvedValue(orden({ detalleEstado: 'Pago rechazado: rejected' }));
    mockCancelar.mockResolvedValue(orden({ estado: 'CANCELADA', urlPago: null }));

    renderEn(`/pagos/resultado?referencia=${REF}&payment_id=null`);

    expect(await screen.findByTestId('pago-rechazado')).toBeInTheDocument();
    expect(mockConfirmar).toHaveBeenCalledWith(REF, undefined);

    await user.click(screen.getByRole('button', { name: /Volver a la pasarela/i }));
    expect(mockAssign).toHaveBeenCalledWith('https://mp/checkout');

    await user.click(screen.getByRole('button', { name: 'Cancelar pago' }));
    expect(await screen.findByTestId('pago-cancelado')).toBeInTheDocument();
    expect(mockCancelar).toHaveBeenCalledWith(REF);
  });

  it('una orden pendiente sin intento de pago ofrece terminarlo', async () => {
    mockConfirmar.mockResolvedValue(orden());
    renderEn(`/pagos/resultado?referencia=${REF}`);
    expect(await screen.findByTestId('pago-pendiente')).toBeInTheDocument();
  });

  it('si el pago está en proceso vuelve a consultar hasta que se acredita', async () => {
    mockConfirmar
      .mockResolvedValueOnce(orden({ detalleEstado: 'Pago en proceso: in_process' }))
      .mockResolvedValueOnce(orden({ estado: 'APROBADA', urlPago: null }));

    renderEn(`/pagos/resultado?referencia=${REF}&payment_id=999`);

    expect(await screen.findByTestId('pago-en-proceso')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('pago-aprobado')).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(mockConfirmar).toHaveBeenCalledTimes(2);
  });

  it('una orden vencida avisa que no se cobró', async () => {
    mockConfirmar.mockResolvedValue(orden({ estado: 'VENCIDA', urlPago: null }));
    renderEn(`/pagos/resultado?referencia=${REF}`);
    expect(await screen.findByText('El pago venció')).toBeInTheDocument();
  });

  it('una orden en revisión explica que se cobró y se va a revisar', async () => {
    mockConfirmar.mockResolvedValue(orden({ estado: 'REQUIERE_REVISION', urlPago: null }));
    renderEn(`/pagos/resultado?referencia=${REF}`);
    expect(await screen.findByTestId('pago-revision')).toBeInTheDocument();
  });

  it('si no se puede verificar, muestra el error', async () => {
    mockConfirmar.mockRejectedValue(new Error('La orden de pago pertenece a otro usuario'));
    renderEn(`/pagos/resultado?referencia=${REF}`);
    expect(await screen.findByText('La orden de pago pertenece a otro usuario')).toBeInTheDocument();
  });
});
