import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EventoCard } from './EventoCard';
import type { Evento } from '../types';

describe('EventoCard', () => {
  const eventoPublicado: Evento = {
    id: 42,
    nombre: 'Clase Abierta de Natación',
    descripcion: 'Práctica libre y aquagym',
    capacidadMaxima: 50,
    entradasDisponibles: 20,
    entradasVendidas: 5,
    precio: '0',
    descuentoSocio: 0,
    requiereEntrada: true,
    estado: 'PUBLICADO',
    fechaEvento: '2026-11-20T10:00:00Z',
    fechaFin: '2026-11-20T12:00:00Z',
    inicioVenta: '2026-09-01T00:00:00Z',
    finVenta: '2026-11-20T09:00:00Z',
    lugarAcreditacion: 'Natatorio principal',
    imageUrl: 'socialclub-frontend/src/assets/favicon-blanco.png',
  };

  it('renderiza título, descripción, chips y botón Comprar entradas cuando el evento está disponible', () => {
    render(
      <MemoryRouter>
        <EventoCard evento={eventoPublicado} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Clase Abierta de Natación')).toBeInTheDocument();
    expect(screen.getByText('Práctica libre y aquagym')).toBeInTheDocument();
    expect(screen.getByText('Gratis')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /comprar entradas/i })).toHaveAttribute(
      'href',
      '/eventos/42/entradas',
    );
  });

  it('omite el botón Comprar entradas si el evento está agotado', () => {
    const eventoAgotado: Evento = {
      ...eventoPublicado,
      entradasDisponibles: 0,
    };

    render(
      <MemoryRouter>
        <EventoCard evento={eventoAgotado} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /comprar entradas/i })).not.toBeInTheDocument();
  });

  it('prioriza la imagen temporal local (tempImageUrl) sobre la default', () => {
    const eventoConTemp: Evento = {
      ...eventoPublicado,
      tempImageUrl: 'blob:http://localhost:3000/123-abc',
    };

    render(
      <MemoryRouter>
        <EventoCard evento={eventoConTemp} />
      </MemoryRouter>,
    );

    const img = screen.getByRole('img', { name: 'Clase Abierta de Natación' });
    expect(img).toHaveAttribute('src', 'blob:http://localhost:3000/123-abc');
  });

  it('muestra el chip de precio socio cuando hay descuento', () => {
    const eventoConDescuento: Evento = {
      ...eventoPublicado,
      precio: '5000',
      descuentoSocio: 20,
    };

    render(
      <MemoryRouter>
        <EventoCard evento={eventoConDescuento} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
  });

  it('no muestra chip de entradas ni botón comprar si no requiere entrada', () => {
    const eventoLibre: Evento = {
      ...eventoPublicado,
      requiereEntrada: false,
      precio: '0',
    };

    render(
      <MemoryRouter>
        <EventoCard evento={eventoLibre} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /comprar entradas/i })).not.toBeInTheDocument();
  });
});
