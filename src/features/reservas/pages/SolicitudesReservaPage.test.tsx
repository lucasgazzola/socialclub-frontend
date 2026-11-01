import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { SolicitudesReservaPage } from './SolicitudesReservaPage';
import type { SolicitudReserva } from '../types';

const api = vi.hoisted(() => ({
  solicitudes: vi.fn(),
  aprobar: vi.fn(),
  rechazar: vi.fn(),
  registrarSena: vi.fn(),
  cancelarPorInstitucion: vi.fn(),
  cancelarPorFaltaPago: vi.fn(),
}));
vi.mock('../api/reservas.api', () => ({ reservasApi: api }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function solicitud(extra: Partial<SolicitudReserva> = {}): SolicitudReserva {
  return {
    id: 10,
    codigo: 'RES-ABC234',
    estado: 'PENDIENTE_APROBACION',
    espacio: { id: 1, nombre: 'Cancha de fútbol 5', modalidad: 'POR_HORA' },
    inicio: '2026-11-06T22:00:00Z',
    fin: '2026-11-07T00:00:00Z',
    turno: 'vie 06/11/2026 19:00 a 21:00',
    esSocio: true,
    montoTotal: 24000,
    montoSena: 6000,
    observaciones: null,
    limitePagoSena: null,
    limitePagoSenaTexto: null,
    senaPagadaEn: null,
    metodoPagoSena: null,
    motivoRechazo: null,
    motivoCancelacion: null,
    creadoEn: '2026-11-01T10:00:00Z',
    solicitante: {
      usuarioId: 7,
      nombre: 'Lucía Registrada',
      dni: '30000003',
      telefono: '3534000000',
      email: 'lucia@club.local',
      esSocio: true,
      cuotasAdeudadas: 2,
      deuda: 20000,
    },
    conflictos: [],
    ...extra,
  };
}

describe('US-60/61 · SolicitudesReservaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.solicitudes.mockResolvedValue([solicitud()]);
  });

  it('TC-273 · TC-274 · muestra la bandeja de pendientes con solicitante, condición, turno y montos', async () => {
    renderWithProviders(<SolicitudesReservaPage />);

    const fila = await screen.findByTestId('reserva-RES-ABC234');
    expect(api.solicitudes).toHaveBeenCalledWith(['PENDIENTE_APROBACION'], '');
    expect(within(fila).getByText('Lucía Registrada')).toBeInTheDocument();
    expect(within(fila).getByText(/DNI 30\.000\.003 · Tel\. 3534000000/)).toBeInTheDocument();
    expect(within(fila).getByText('Socio')).toBeInTheDocument();
    expect(within(fila).getByText('Debe 2 cuota(s) · $20.000,00')).toBeInTheDocument();
    expect(within(fila).getByText('vie 06/11/2026 19:00 a 21:00')).toBeInTheDocument();
    expect(within(fila).getByText('$24.000,00')).toBeInTheDocument();
    expect(within(fila).getByText('Seña $6.000,00')).toBeInTheDocument();
  });

  it('TC-276 · avisa si el turno pedido ya está ocupado', async () => {
    api.solicitudes.mockResolvedValue([
      solicitud({ conflictos: [{ tipo: 'RESERVA', detalle: 'Reserva RES-OTRA22', desde: 'vie 06/11/2026 20:00', hasta: 'vie 06/11/2026 22:00' }] }),
    ]);
    renderWithProviders(<SolicitudesReservaPage />);

    expect(await screen.findByText(/Turno ocupado: Reserva RES-OTRA22 \(20:00–22:00\)/)).toBeInTheDocument();
  });

  it('TC-275 · aprueba con confirmación y muestra el mensaje de la API', async () => {
    const user = userEvent.setup();
    api.aprobar.mockResolvedValue({ mensaje: 'Solicitud RES-ABC234 aprobada.' });
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(await screen.findByRole('button', { name: /Aprobar/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Aprobar solicitud' });
    await user.click(within(dialogo).getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(api.aprobar).toHaveBeenCalledWith(10));
    expect(toast.success).toHaveBeenCalledWith('Solicitud RES-ABC234 aprobada.');
  });

  it('TC-277 · rechazar exige el motivo antes de llamar a la API', async () => {
    const user = userEvent.setup();
    api.rechazar.mockResolvedValue({ mensaje: 'Solicitud RES-ABC234 rechazada.' });
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(await screen.findByRole('button', { name: /Rechazar/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Rechazar solicitud' });
    await user.click(within(dialogo).getByRole('button', { name: 'Rechazar solicitud' }));
    expect(within(dialogo).getByText('El motivo es obligatorio (al menos 5 caracteres).')).toBeInTheDocument();
    expect(api.rechazar).not.toHaveBeenCalled();

    await user.type(within(dialogo).getByLabelText('Motivo *'), 'Salón ocupado por un evento');
    await user.click(within(dialogo).getByRole('button', { name: 'Rechazar solicitud' }));

    await waitFor(() => expect(api.rechazar).toHaveBeenCalledWith(10, 'Salón ocupado por un evento'));
  });

  it('TC-278 · en «Pendientes de pago» registra la seña y ofrece cancelar por falta de pago si venció', async () => {
    const user = userEvent.setup();
    api.solicitudes.mockImplementation((estados: string[]) =>
      Promise.resolve(
        estados[0] === 'APROBADA_PENDIENTE_PAGO'
          ? [solicitud({ estado: 'APROBADA_PENDIENTE_PAGO', limitePagoSena: '2020-01-01T00:00:00Z', limitePagoSenaTexto: 'mié 01/01/2020 00:00' })]
          : [],
      ),
    );
    api.registrarSena.mockResolvedValue({ mensaje: 'Seña registrada.' });
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(screen.getByText('Pendientes de pago', { exact: true }));
    expect(await screen.findByText(/Seña vencida el mié 01\/01\/2020 00:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar por falta de pago' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Registrar seña/ }));
    const dialogo = screen.getByRole('dialog', { name: 'Registrar cobro de la seña' });
    await user.selectOptions(within(dialogo).getByLabelText('Método de pago'), 'TRANSFERENCIA');
    await user.click(within(dialogo).getByRole('button', { name: 'Registrar y confirmar' }));

    await waitFor(() => expect(api.registrarSena).toHaveBeenCalledWith(10, 'TRANSFERENCIA'));
  });

  it('TC-283 · cancela una reserva confirmada por el club con motivo', async () => {
    const user = userEvent.setup();
    api.solicitudes.mockImplementation((estados: string[]) =>
      Promise.resolve(estados[0] === 'CONFIRMADA' ? [solicitud({ estado: 'CONFIRMADA' })] : []),
    );
    api.cancelarPorInstitucion.mockResolvedValue({ mensaje: 'Reserva cancelada.' });
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(screen.getByText('Confirmadas', { exact: true }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    const dialogo = screen.getByRole('dialog', { name: 'Cancelar reserva por el club' });
    expect(dialogo).toHaveTextContent('corresponde devolverla');
    await user.type(within(dialogo).getByLabelText('Motivo *'), 'Torneo oficial del club');
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));

    await waitFor(() => expect(api.cancelarPorInstitucion).toHaveBeenCalledWith(10, 'Torneo oficial del club'));
  });

  it('TC-283 · la pestaña «Canceladas» pide los tres estados de cancelación y muestra el motivo', async () => {
    const user = userEvent.setup();
    api.solicitudes.mockResolvedValue([solicitud({ estado: 'CANCELADA_INSTITUCION', motivoCancelacion: 'Torneo oficial' })]);
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(screen.getByText('Canceladas', { exact: true }));

    await waitFor(() =>
      expect(api.solicitudes).toHaveBeenLastCalledWith(
        ['CANCELADA_USUARIO', 'CANCELADA_FALTA_PAGO', 'CANCELADA_INSTITUCION'],
        '',
      ),
    );
    expect(await screen.findByText('Motivo: Torneo oficial')).toBeInTheDocument();
  });

  it('muestra el error de la API y un mensaje si no hay reservas', async () => {
    api.solicitudes.mockResolvedValueOnce([]);
    renderWithProviders(<SolicitudesReservaPage />);
    expect(await screen.findByText('No hay reservas en este estado.')).toBeInTheDocument();
  });

  it('TC-276 · si la aprobación falla (turno ocupado), muestra el error', async () => {
    const user = userEvent.setup();
    api.aprobar.mockRejectedValue(new Error('El turno ya no está disponible'));
    renderWithProviders(<SolicitudesReservaPage />);

    await user.click(await screen.findByRole('button', { name: /Aprobar/ }));
    await user.click(within(screen.getByRole('dialog', { name: 'Aprobar solicitud' })).getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('El turno ya no está disponible'));
  });
});
