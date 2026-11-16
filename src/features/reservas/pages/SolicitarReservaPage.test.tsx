import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { SolicitarReservaPage } from './SolicitarReservaPage';
import type { EspacioParaReserva, PresupuestoReserva } from '../types';

const api = vi.hoisted(() => ({
  espaciosDisponibles: vi.fn(),
  disponibilidad: vi.fn(),
  presupuesto: vi.fn(),
  solicitar: vi.fn(),
}));
vi.mock('../api/reservas.api', () => ({ reservasApi: api }));

const canchaPorHora: EspacioParaReserva = {
  id: 1,
  nombre: 'Cancha Fútbol 5',
  tipo: 'CANCHA',
  capacidadMaxima: 10,
  modalidad: 'POR_HORA',
  ubicacion: 'Sector Norte',
  descripcion: 'Césped sintético',
  espacioPadreId: null,
  espacioPadre: null,
  subespacios: [],
  precio: 15000,
  descuentoSocio: 20,
  precioSocio: 12000,
  montoSena: 6000,
  disciplinas: [{ id: 1, nombre: 'Fútbol' }],
};

const salonDiaCompleto: EspacioParaReserva = {
  id: 2,
  nombre: 'Salón Principal',
  tipo: 'SALON',
  capacidadMaxima: 80,
  modalidad: 'DIA_COMPLETO',
  ubicacion: 'Edificio Central',
  descripcion: 'Salón de eventos',
  espacioPadreId: null,
  espacioPadre: null,
  subespacios: [],
  precio: 100000,
  descuentoSocio: 30,
  precioSocio: 70000,
  montoSena: 30000,
  disciplinas: [],
};

function siguienteMesInfo() {
  const hoy = new Date();
  const sig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15);
  const anio = sig.getFullYear();
  const mes = String(sig.getMonth() + 1).padStart(2, '0');
  return {
    fecha15: `${anio}-${mes}-15`,
    fecha16: `${anio}-${mes}-16`,
  };
}

function presupuestoBase(extra: Partial<PresupuestoReserva> = {}): PresupuestoReserva {
  return {
    disponible: true,
    conflictos: [],
    inicio: '2026-12-15T21:00:00Z',
    fin: '2026-12-15T23:00:00Z',
    modalidad: 'POR_HORA',
    cantidad: 2,
    esSocio: true,
    alDia: true,
    aplicaTarifaSocio: true,
    cuotasAdeudadas: 0,
    precioRegularUnitario: 15000,
    precioSocioUnitario: 12000,
    descuentoSocioPct: 20,
    montoRegular: 30000,
    descuentoAplicado: 6000,
    montoTotal: 24000,
    montoSena: 6000,
    ...extra,
  };
}

describe('US-59 · SolicitarReservaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.espaciosDisponibles.mockResolvedValue([canchaPorHora, salonDiaCompleto]);
    api.disponibilidad.mockResolvedValue({
      espacioId: 1,
      modalidad: 'POR_HORA',
      desde: '2026-12-01',
      hasta: '2026-12-31',
      ocupados: [],
    });
    api.presupuesto.mockResolvedValue(presupuestoBase());
  });

  it('muestra calendario con bloqueos/reservas deshabilitados (CA 1) y permite seleccionar fecha y rango horario (CA 2)', async () => {
    const user = userEvent.setup();
    const { fecha15 } = siguienteMesInfo();
    api.disponibilidad.mockResolvedValue({
      espacioId: 1,
      modalidad: 'POR_HORA',
      desde: '2026-12-01',
      hasta: '2026-12-31',
      ocupados: [
        {
          tipo: 'BLOQUEO',
          inicio: `${fecha15}T21:00:00.000Z`, // 18:00 AR
          fin: `${fecha15}T22:00:00.000Z`, // 19:00 AR
          detalle: 'Mantenimiento',
        },
      ],
    });

    renderWithProviders(<SolicitarReservaPage />);
    await screen.findByLabelText(/Elegí el espacio/i);

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    const btnDia15 = await screen.findByRole('button', { name: new RegExp(`Día ${fecha15}`) });
    await user.click(btnDia15);

    const bloqueOcupado = await screen.findByRole('button', { name: '18:00–19:00' });
    expect(bloqueOcupado).toBeDisabled();

    const bloqueLibre = screen.getByRole('button', { name: '19:00–20:00' });
    expect(bloqueLibre).not.toBeDisabled();
    await user.click(bloqueLibre);

    await waitFor(() => {
      expect(api.presupuesto).toHaveBeenCalledWith(
        expect.objectContaining({
          espacioId: 1,
          fecha: fecha15,
          horaInicio: '19:00',
          horaFin: '20:00',
        }),
      );
    });
  });

  it('en modalidad DIA_COMPLETO deshabilita días ocupados y no muestra selector horario (CA 3)', async () => {
    const user = userEvent.setup();
    const { fecha15, fecha16 } = siguienteMesInfo();
    api.disponibilidad.mockResolvedValue({
      espacioId: 2,
      modalidad: 'DIA_COMPLETO',
      desde: '2026-12-01',
      hasta: '2026-12-31',
      ocupados: [
        {
          tipo: 'RESERVA',
          inicio: `${fecha15}T03:00:00.000Z`,
          fin: `${fecha16}T03:00:00.000Z`,
          detalle: 'Reserva RES-AAA111',
        },
      ],
    });
    api.presupuesto.mockResolvedValue(
      presupuestoBase({
        modalidad: 'DIA_COMPLETO',
        cantidad: 1,
        montoRegular: 100000,
        descuentoAplicado: 30000,
        montoTotal: 70000,
        montoSena: 30000,
      }),
    );

    renderWithProviders(<SolicitarReservaPage />);
    const select = await screen.findByLabelText(/Elegí el espacio/i);
    await user.selectOptions(select, '2');

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    const diaOcupado = await screen.findByRole('button', { name: new RegExp(`Día ${fecha15}`) });
    expect(diaOcupado).toBeDisabled();

    const diaLibre = screen.getByRole('button', { name: new RegExp(`Día ${fecha16}`) });
    expect(diaLibre).not.toBeDisabled();
    await user.click(diaLibre);

    expect(screen.queryByLabelText('Hora de inicio')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(api.presupuesto).toHaveBeenCalledWith({ espacioId: 2, fecha: fecha16 });
    });
  });

  it('muestra presupuesto con descuento socio al día, aviso a socio moroso y seña obligatoria (CA 5 & 6)', async () => {
    const user = userEvent.setup();
    const { fecha15 } = siguienteMesInfo();
    api.presupuesto.mockResolvedValueOnce(
      presupuestoBase({
        esSocio: true,
        alDia: false,
        aplicaTarifaSocio: false,
        cuotasAdeudadas: 2,
        descuentoAplicado: 0,
        montoTotal: 30000,
        montoSena: 6000,
      }),
    );

    renderWithProviders(<SolicitarReservaPage />);
    await screen.findByLabelText(/Elegí el espacio/i);

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    await user.click(await screen.findByRole('button', { name: new RegExp(`Día ${fecha15}`) }));

    expect(await screen.findByText(/Tenés 2 cuotas pendientes/i)).toBeInTheDocument();
    expect(screen.getByText(/Seña obligatoria:/i)).toBeInTheDocument();
  });

  it('bloquea envío si no hay disponibilidad en tiempo real (CA 4) y emite código RES-XXXXXX al enviar (CA 7)', async () => {
    const user = userEvent.setup();
    const { fecha15 } = siguienteMesInfo();
    api.presupuesto
      .mockResolvedValueOnce(
        presupuestoBase({
          disponible: false,
          conflictos: [
            {
              tipo: 'RESERVA',
              inicio: `${fecha15}T21:00:00Z`,
              fin: `${fecha15}T23:00:00Z`,
              detalle: 'Reserva RES-OCUP99',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(presupuestoBase({ disponible: true }));
    api.solicitar.mockResolvedValueOnce({
      mensaje: 'Solicitud RES-7KQ4ZP enviada.',
      reserva: {
        id: 50,
        codigo: 'RES-7KQ4ZP',
        estado: 'PENDIENTE_APROBACION',
        espacio: { id: 1, nombre: 'Cancha Fútbol 5', modalidad: 'POR_HORA' },
        inicio: `${fecha15}T22:00:00Z`,
        fin: `${fecha15}T23:00:00Z`,
        turno: '19:00 a 20:00',
        esSocio: true,
        montoTotal: 12000,
        montoSena: 6000,
        observaciones: 'Amistoso',
        limitePagoSena: null,
        limitePagoSenaTexto: null,
        senaPagadaEn: null,
        metodoPagoSena: null,
        motivoRechazo: null,
        motivoCancelacion: null,
        creadoEn: new Date().toISOString(),
      },
    });

    renderWithProviders(<SolicitarReservaPage />);
    await screen.findByLabelText(/Elegí el espacio/i);

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    await user.click(await screen.findByRole('button', { name: new RegExp(`Día ${fecha15}`) }));

    expect(await screen.findByText(/No disponible: Reserva RES-OCUP99/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solicitar reserva/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '19:00–20:00' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Solicitar reserva/i })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /Solicitar reserva/i }));

    expect(await screen.findByText('RES-7KQ4ZP')).toBeInTheDocument();
    expect(screen.getByText(/Pendiente de aprobación/i)).toBeInTheDocument();
  });
});
