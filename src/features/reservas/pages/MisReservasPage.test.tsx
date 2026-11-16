import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { MisReservasPage } from './MisReservasPage';
import type { MiReserva } from '../types';

const api = vi.hoisted(() => ({ mias: vi.fn(), cancelar: vi.fn(), pagarSena: vi.fn() }));
vi.mock('../api/reservas.api', () => ({ reservasApi: api }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockIrAPagar = vi.fn();
vi.mock('@/features/pasarela/hooks/usePasarela', () => ({ irAPagar: (u: string) => mockIrAPagar(u) }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

function mia(extra: Partial<MiReserva> = {}): MiReserva {
  return {
    id: 10,
    codigo: 'RES-ABC234',
    estado: 'CONFIRMADA',
    espacio: { id: 1, nombre: 'Salón principal', modalidad: 'POR_HORA' },
    inicio: '2026-11-13T23:00:00Z',
    fin: '2026-11-14T03:00:00Z',
    turno: 'vie 13/11/2026 20:00 a 24:00',
    esSocio: true,
    montoTotal: 128000,
    montoSena: 20000,
    observaciones: null,
    limitePagoSena: null,
    limitePagoSenaTexto: null,
    senaPagadaEn: null,
    metodoPagoSena: null,
    motivoRechazo: null,
    motivoCancelacion: null,
    creadoEn: '2026-11-01T10:00:00Z',
    limiteCancelacion: '2026-11-11T23:00:00Z',
    limiteCancelacionTexto: 'mié 11/11/2026 20:00',
    puedeCancelar: true,
    puedePagarSena: false,
    instruccionesSena: null,
    ...extra,
  };
}

describe('US-62 · MisReservasPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-286 · lista código, espacio, turno, monto y estado de cada reserva', async () => {
    api.mias.mockResolvedValue([mia(), mia({ id: 11, codigo: 'RES-XYZ789', estado: 'RECHAZADA', motivoRechazo: 'Torneo oficial', puedeCancelar: false })]);
    renderWithProviders(<MisReservasPage />);

    const fila = await screen.findByTestId('mi-reserva-RES-ABC234');
    expect(within(fila).getByText('Salón principal')).toBeInTheDocument();
    expect(within(fila).getByText('vie 13/11/2026 20:00 a 24:00')).toBeInTheDocument();
    expect(within(fila).getByText('$128.000,00')).toBeInTheDocument();
    expect(within(fila).getByText('Confirmada')).toBeInTheDocument();
    const rechazada = screen.getByTestId('mi-reserva-RES-XYZ789');
    expect(within(rechazada).getByText('Rechazada')).toBeInTheDocument();
    expect(within(rechazada).getByText('Motivo: Torneo oficial')).toBeInTheDocument();
    expect(within(rechazada).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('TC-288 · sin reservas muestra un mensaje informativo', async () => {
    api.mias.mockResolvedValue([]);
    renderWithProviders(<MisReservasPage />);
    expect(await screen.findByText('Todavía no hiciste ninguna solicitud de reserva.')).toBeInTheDocument();
  });

  it('TC-287 · TC-279 · una aprobada pendiente de pago destaca el límite, las instrucciones y paga la seña online', async () => {
    const user = userEvent.setup();
    api.mias.mockResolvedValue([
      mia({
        estado: 'APROBADA_PENDIENTE_PAGO',
        limitePagoSenaTexto: 'lun 02/11/2026 16:29',
        puedePagarSena: true,
        instruccionesSena: 'Podés pagarla online con Mercado Pago o en la secretaría del club.',
      }),
    ]);
    api.pagarSena.mockResolvedValue({ referencia: 'ref', urlPago: 'https://mp/checkout' });
    renderWithProviders(<MisReservasPage />);

    const aviso = await screen.findByTestId('sena-pendiente-RES-ABC234');
    expect(aviso).toHaveTextContent('Pagá la seña de $20.000,00 antes del lun 02/11/2026 16:29');
    expect(aviso).toHaveTextContent('Podés pagarla online con Mercado Pago');

    await user.click(within(aviso).getByRole('button', { name: /Pagar seña con Mercado Pago/ }));

    await waitFor(() => expect(mockIrAPagar).toHaveBeenCalledWith('https://mp/checkout'));
    expect(api.pagarSena).toHaveBeenCalledWith(10);
  });

  it('TC-284 · cancela una reserva propia con confirmación', async () => {
    const user = userEvent.setup();
    api.mias.mockResolvedValue([mia()]);
    api.cancelar.mockResolvedValue({ mensaje: 'Cancelaste la reserva RES-ABC234. El turno quedó libre.' });
    renderWithProviders(<MisReservasPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    const dialogo = screen.getByRole('dialog', { name: 'Cancelar reserva' });
    expect(dialogo).toHaveTextContent('devolución de la seña');
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));

    await waitFor(() => expect(api.cancelar).toHaveBeenCalledWith(10));
    expect(toast.success).toHaveBeenCalledWith('Cancelaste la reserva RES-ABC234. El turno quedó libre.');
  });

  it('TC-285 · si ya pasó el plazo de penalización, muestra el error de la API', async () => {
    const user = userEvent.setup();
    api.mias.mockResolvedValue([mia()]);
    api.cancelar.mockRejectedValue(new Error('Solo podés cancelar hasta 48 horas antes del turno'));
    renderWithProviders(<MisReservasPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Cancelar reserva' })).getByRole('button', { name: 'Cancelar reserva' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Solo podés cancelar hasta 48 horas antes del turno'));
  });
});
