import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReporteAsistenciaPage } from './ReporteAsistenciaPage';
import { useAsistenciaEventos } from '../hooks/useAsistenciaEventos';
import * as exportUtils from '../utils/exportarReporteAsistencia';
import type { ReporteAsistenciaEventos } from '../types';

vi.mock('../hooks/useAsistenciaEventos', () => ({ useAsistenciaEventos: vi.fn() }));
vi.mock('../utils/exportarReporteAsistencia', () => ({
  exportarAsistenciaCsv: vi.fn(),
  exportarAsistenciaPdf: vi.fn(),
}));

const reporteMock: ReporteAsistenciaEventos = {
  generadoEn: '2026-10-22T20:00:00.000Z',
  filtros: { eventoId: undefined, desde: undefined, hasta: undefined, estado: undefined },
  totales: {
    totalEventos: 2,
    totalCapacidad: 150,
    totalEntradas: 120,
    totalAsistentes: 100,
    totalAusentes: 20,
    porcentajeOcupacionPromedio: 66.7,
    porcentajeAsistenciaPromedio: 83.3,
    totalRecaudado: 300000,
  },
  eventos: [
    {
      id: 1,
      nombre: 'Torneo Apertura de Pádel',
      descripcion: 'Torneo de parejas',
      estado: 'FINALIZADO',
      requiereEntrada: true,
      fechaEvento: '2026-08-15T15:00:00.000Z',
      fechaFin: '2026-08-15T21:00:00.000Z',
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
      nombre: 'Festival Gastronómico y Peña',
      descripcion: 'Cena y peña',
      estado: 'FINALIZADO',
      requiereEntrada: true,
      fechaEvento: '2026-09-12T20:30:00.000Z',
      fechaFin: '2026-09-13T03:00:00.000Z',
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
  ],
};

describe('US-36 · ReporteAsistenciaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el encabezado tipográfico conforme a los estándares UI/UX', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: reporteMock,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Reporte de asistencia a eventos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Métricas de asistencia, porcentaje de ocupación y ausentismo/i),
    ).toBeInTheDocument();
  });

  it('renderiza las tarjetas de KPIs con los totales calculados', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: reporteMock,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);

    expect(screen.getByTestId('kpi-asistentes')).toHaveTextContent('100');
    expect(screen.getByTestId('kpi-entradas')).toHaveTextContent('120');
    expect(screen.getByTestId('kpi-ocupacion')).toHaveTextContent('66,7 %');
    expect(screen.getByTestId('kpi-ausentes')).toHaveTextContent('20');
  });

  it('muestra la tabla detallada con los eventos y sus métricas de asistencia', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: reporteMock,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);

    const tabla = screen.getByRole('table');
    expect(within(tabla).getByText('Torneo Apertura de Pádel')).toBeInTheDocument();
    expect(within(tabla).getByText('Festival Gastronómico y Peña')).toBeInTheDocument();
    expect(within(tabla).getByText('75 %')).toBeInTheDocument();
    expect(within(tabla).getByText('100 %')).toBeInTheDocument();
  });

  it('permite accionar los botones de exportación a CSV y PDF', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: reporteMock,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);

    const botonCsv = screen.getByRole('button', { name: /Exportar CSV/i });
    const botonPdf = screen.getByRole('button', { name: /Exportar PDF/i });

    fireEvent.click(botonCsv);
    expect(exportUtils.exportarAsistenciaCsv).toHaveBeenCalledWith(reporteMock);

    fireEvent.click(botonPdf);
    expect(exportUtils.exportarAsistenciaPdf).toHaveBeenCalledWith(reporteMock);
  });

  it('permite filtrar por estado y limpiar filtros', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: reporteMock,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);

    const selectEstado = screen.getByLabelText(/Filtrar por estado/i);
    fireEvent.change(selectEstado, { target: { value: 'FINALIZADO' } });

    // Debe aparecer el botón de limpiar filtros
    const botonLimpiar = screen.getByRole('button', { name: /Limpiar filtros/i });
    expect(botonLimpiar).toBeInTheDocument();

    fireEvent.click(botonLimpiar);
    expect(selectEstado).toHaveValue('');
  });

  it('muestra spinner cuando está cargando los datos', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { container } = render(<ReporteAsistenciaPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de error si falla la consulta', () => {
    vi.mocked(useAsistenciaEventos).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error de conexión con el backend'),
      refetch: vi.fn(),
    } as any);

    render(<ReporteAsistenciaPage />);
    expect(screen.getByText(/No se pudo cargar el reporte de asistencia/i)).toBeInTheDocument();
    expect(screen.getByText(/Error de conexión con el backend/i)).toBeInTheDocument();
  });
});
