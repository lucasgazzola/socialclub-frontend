import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { DashboardMetricas } from '../types/dashboard.types';
import { DashboardGraficos } from './DashboardGraficos';

const METRICAS_CON_DATOS: DashboardMetricas = {
  totalIntegrantesActivos: 100,
  porcentajeMorosos: 25,
  cantidadMorosos: 25,
  documentosPorVencer: 4,
  inscripcionesIrregulares: {
    total: 9,
    pendientes: 6,
    bloqueadas: 3,
    habilitadas: 21,
  },
  composicionIntegrantes: {
    soloSocios: 50,
    sociosDeportistas: 30,
    soloDeportistas: 20,
  },
  morosidadPorConcepto: {
    cuotaSocial: 18,
    cuotaDeportiva: 12,
    ambasCuotas: 5,
  },
  participantesPorDisciplina: [
    {
      disciplinaId: 1,
      nombre: 'Fútbol',
      inscriptos: 18,
      habilitados: 12,
      irregulares: 6,
    },
    {
      disciplinaId: 2,
      nombre: 'Básquet',
      inscriptos: 12,
      habilitados: 9,
      irregulares: 3,
    },
  ],
  proximosEventos: [
    {
      id: 1,
      nombre: 'Torneo de Fútbol Interclubes 2026',
      fechaEvento: '2026-11-15T18:00:00.000Z',
      fechaFin: null,
      lugarAcreditacion: 'Predio Central',
      capacidadMaxima: 80,
      entradasDisponibles: 15,
      entradasVendidas: 65,
    },
  ],
};

const METRICAS_VACIAS: DashboardMetricas = {
  totalIntegrantesActivos: 0,
  porcentajeMorosos: 0,
  cantidadMorosos: 0,
  documentosPorVencer: 0,
  inscripcionesIrregulares: {
    total: 0,
    pendientes: 0,
    bloqueadas: 0,
    habilitadas: 0,
  },
  composicionIntegrantes: {
    soloSocios: 0,
    sociosDeportistas: 0,
    soloDeportistas: 0,
  },
  morosidadPorConcepto: {
    cuotaSocial: 0,
    cuotaDeportiva: 0,
    ambasCuotas: 0,
  },
  participantesPorDisciplina: [],
  proximosEventos: [],
};

describe('DashboardGraficos', () => {
  it('renderiza los 6 gráficos con sus etiquetas y valores cuando hay datos', () => {
    render(<DashboardGraficos metricas={METRICAS_CON_DATOS} />);

    // 1. Dona Morosos vs. Al día
    const cardMorosidad = screen.getByTestId('grafico-morosidad');
    expect(within(cardMorosidad).getByText('Morosos vs. Al día')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-morosidad-chart')).toBeInTheDocument();
    expect(screen.getByTestId('resumen-morosidad-al-dia')).toHaveTextContent('75 (75.0%)');
    expect(screen.getByTestId('resumen-morosidad-morosos')).toHaveTextContent('25 (25.0%)');

    // 2. Barras Inscripciones pendientes vs. bloqueadas
    const cardInscripciones = screen.getByTestId('grafico-inscripciones');
    expect(
      within(cardInscripciones).getByText('Inscripciones pendientes vs. bloqueadas'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('grafico-inscripciones-chart')).toBeInTheDocument();
    expect(screen.getByTestId('resumen-inscripciones-pendientes')).toHaveTextContent('6');
    expect(screen.getByTestId('resumen-inscripciones-bloqueadas')).toHaveTextContent('3');

    // 3. Dona Composición de Integrantes Activos
    expect(screen.getByTestId('grafico-composicion-chart')).toBeInTheDocument();
    expect(screen.getByText('Solo socios:')).toBeInTheDocument();
    expect(screen.getByText('Socios deportistas:')).toBeInTheDocument();
    expect(screen.getByText('Solo deportistas:')).toBeInTheDocument();

    // 4. Barras Morosos por Tipo de Cuota
    expect(screen.getByTestId('grafico-morosidad-concepto-chart')).toBeInTheDocument();
    expect(screen.getByText('18 (18%)')).toBeInTheDocument();
    expect(screen.getByText('12 (12%)')).toBeInTheDocument();
    expect(screen.getByText('5 (5%)')).toBeInTheDocument();

    // 5. Barras Horizontales Participantes por Disciplina
    expect(screen.getByTestId('grafico-disciplinas-chart')).toBeInTheDocument();
    expect(screen.getByText('Habilitados')).toBeInTheDocument();
    expect(screen.getByText('Con observación')).toBeInTheDocument();

    // 6. Barras Horizontales Ocupación de Próximos Eventos
    expect(screen.getByTestId('grafico-ocupacion-eventos-chart')).toBeInTheDocument();
    expect(screen.getByText('65/80 · 81%')).toBeInTheDocument();
  });

  it('muestra estados vacíos sin errores en los 6 gráficos cuando los datos son 0', () => {
    render(<DashboardGraficos metricas={METRICAS_VACIAS} />);

    expect(screen.getByTestId('grafico-morosidad-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-inscripciones-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-composicion-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-morosidad-concepto-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-disciplinas-vacio')).toBeInTheDocument();
    expect(screen.getByTestId('grafico-ocupacion-eventos-vacio')).toBeInTheDocument();
  });
});
