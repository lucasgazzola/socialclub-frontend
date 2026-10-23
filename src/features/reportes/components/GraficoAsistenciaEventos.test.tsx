import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraficoAsistenciaEventos } from './GraficoAsistenciaEventos';
import type { EventoReporteItem } from '../types';

const eventosMock: EventoReporteItem[] = [
  {
    id: 1,
    nombre: 'Torneo Apertura de Pádel',
    descripcion: 'Torneo de parejas',
    estado: 'FINALIZADO',
    requiereEntrada: true,
    fechaEvento: '2026-08-15T15:00:00.000Z',
    fechaFin: null,
    lugarAcreditacion: 'Canchas centrales',
    capacidadMaxima: 100,
    entradasDisponibles: 20,
    precio: 2500,
    totalEntradas: 80,
    ingresosValidados: 60,
    ausentes: 20,
    porcentajeOcupacion: 60,
    porcentajeAsistencia: 75,
    recaudado: 200000,
  },
  {
    id: 2,
    nombre: 'Festival Gastronómico',
    descripcion: 'Cena y peña',
    estado: 'FINALIZADO',
    requiereEntrada: true,
    fechaEvento: '2026-09-12T20:30:00.000Z',
    fechaFin: null,
    lugarAcreditacion: 'Salón principal',
    capacidadMaxima: 50,
    entradasDisponibles: 10,
    precio: 2500,
    totalEntradas: 40,
    ingresosValidados: 40,
    ausentes: 0,
    porcentajeOcupacion: 80,
    porcentajeAsistencia: 100,
    recaudado: 100000,
  },
];

describe('US-36 · GraficoAsistenciaEventos', () => {
  it('renderiza el estado vacío cuando no hay eventos con capacidad o entradas', () => {
    render(<GraficoAsistenciaEventos eventos={[]} />);
    expect(
      screen.getByText(/No hay datos suficientes para graficar en el período seleccionado/i),
    ).toBeInTheDocument();
  });

  it('renderiza la leyenda interactiva con los 3 conceptos comparativos', () => {
    render(<GraficoAsistenciaEventos eventos={eventosMock} />);
    expect(screen.getByText('Capacidad total')).toBeInTheDocument();
    expect(screen.getByText('Entradas vendidas')).toBeInTheDocument();
    expect(screen.getByText('Asistentes validados')).toBeInTheDocument();
  });

  it('renderiza el SVG del gráfico accesible con las etiquetas de los eventos', () => {
    render(<GraficoAsistenciaEventos eventos={eventosMock} />);
    const svg = screen.getByRole('img', { name: /Gráfico de barras de asistencia a eventos/i });
    expect(svg).toBeInTheDocument();
    expect(screen.getByText(/Torneo Apertu/i)).toBeInTheDocument();
    expect(screen.getByText(/Festival Gast/i)).toBeInTheDocument();
  });

  it('muestra el tooltip con métricas exactas al pasar el cursor sobre las barras de un evento', () => {
    const { container } = render(<GraficoAsistenciaEventos eventos={eventosMock} />);

    // Buscar los grupos de barras interactivos por evento
    const barGroups = container.querySelectorAll('g.cursor-pointer');
    expect(barGroups.length).toBe(2);

    // Disparar hover en el primer evento
    fireEvent.mouseEnter(barGroups[0]);

    // Verificar que aparece el tooltip con cifras exactas y desglose
    expect(screen.getByText('Torneo Apertura de Pádel')).toBeInTheDocument();
    expect(screen.getByText('Capacidad máxima:')).toBeInTheDocument();
    expect(screen.getByText('Entradas vendidas:')).toBeInTheDocument();
    expect(screen.getByText('Asistentes validados:')).toBeInTheDocument();
    expect(screen.getByText('% Asistencia:')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('% Ocupación:')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Disparar leave para ocultar
    fireEvent.mouseLeave(barGroups[0]);
    expect(screen.queryByText('Capacidad máxima:')).not.toBeInTheDocument();
  });
});
