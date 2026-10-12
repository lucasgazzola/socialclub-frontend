import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { EventoDetalleModal } from './EventoDetalleModal';
import type { Evento } from '../types';

describe('US-53 · EventoDetalleModal', () => {
  const eventoMock: Evento = {
    id: 10,
    nombre: 'Festival de Primavera',
    descripcion: 'Gran festival con actividades deportivas y música en vivo para toda la familia.',
    requiereEntrada: true,
    capacidadMaxima: 200,
    entradasDisponibles: 85,
    entradasVendidas: 115,
    precio: 1500,
    descuentoSocio: 20,
    estado: 'PUBLICADO',
    fechaEvento: '2026-11-15T18:00:00.000Z',
    fechaFin: '2026-11-15T23:00:00.000Z',
    inicioVenta: '2026-10-01T00:00:00.000Z',
    finVenta: '2026-11-15T17:00:00.000Z',
    lugarAcreditacion: 'Gimnasio Principal',
    imageUrl: 'https://ejemplo.com/evento.jpg',
  };

  it('muestra la información completa del evento: título, descripción, fechas, lugar y precios', () => {
    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoMock} open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Festival de Primavera' })).toBeInTheDocument();
    expect(screen.getByText(/Gran festival con actividades deportivas/i)).toBeInTheDocument();
    expect(screen.getByText('Gimnasio Principal')).toBeInTheDocument();
    expect(screen.getByText(/\$ 1\.500/i)).toBeInTheDocument();
    expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
  });

  it('indica claramente cuando un evento es gratuito (precio 0 o no requiere entrada)', () => {
    const eventoGratuito: Evento = {
      ...eventoMock,
      id: 11,
      nombre: 'Charla Abierta',
      precio: 0,
      requiereEntrada: false,
    };

    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoGratuito} open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Acceso libre y gratuito')).toBeInTheDocument();
    expect(screen.getByText('Sin límite de capacidad')).toBeInTheDocument();
  });

  it('muestra las entradas disponibles cuando el evento está en su período de venta', () => {
    // Para que esté en período de venta, Date.now() debe estar entre inicioVenta y finVenta
    const ahora = Date.now();
    const eventoEnVenta: Evento = {
      ...eventoMock,
      inicioVenta: new Date(ahora - 100000).toISOString(),
      finVenta: new Date(ahora + 100000).toISOString(),
      entradasDisponibles: 42,
    };

    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoEnVenta} open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/42 entradas disponibles/i)).toBeInTheDocument();
  });

  it('informa visualmente cuando la venta es próxima a comenzar', () => {
    const ahora = Date.now();
    const eventoVentaProxima: Evento = {
      ...eventoMock,
      inicioVenta: new Date(ahora + 500000).toISOString(),
      finVenta: new Date(ahora + 1000000).toISOString(),
    };

    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoVentaProxima} open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Venta próxima a comenzar/i)).toBeInTheDocument();
  });

  it('informa visualmente cuando el período de venta finalizó', () => {
    const ahora = Date.now();
    const eventoVentaCerrada: Evento = {
      ...eventoMock,
      inicioVenta: new Date(ahora - 1000000).toISOString(),
      finVenta: new Date(ahora - 500000).toISOString(),
    };

    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoVentaCerrada} open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Período de venta finalizado/i)).toBeInTheDocument();
  });

  it('ejecuta onClose al hacer clic en el botón Cerrar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <EventoDetalleModal evento={eventoMock} open={true} onClose={onClose} />
      </MemoryRouter>,
    );

    const modalContent = screen.getByTestId('evento-detalle-modal');
    await user.click(within(modalContent).getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
