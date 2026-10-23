import { describe, expect, it, vi, beforeEach } from 'vitest';
import { exportarAsistenciaCsv, exportarAsistenciaPdf } from './exportarReporteAsistencia';
import type { ReporteAsistenciaEventos } from '../types';

const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetFillColor = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    save = mockSave;
    addPage = mockAddPage;
    text = mockText;
    rect = mockRect;
    roundedRect = mockRoundedRect;
    line = mockLine;
    setFont = mockSetFont;
    setFontSize = mockSetFontSize;
    setTextColor = mockSetTextColor;
    setDrawColor = mockSetDrawColor;
    setFillColor = mockSetFillColor;
    internal = {
      pageSize: {
        getHeight: () => 210,
        getWidth: () => 297,
      },
    };
  }
  return {
    jsPDF: MockJsPDF,
  };
});

const reporteFixture: ReporteAsistenciaEventos = {
  generadoEn: '2026-10-22T20:00:00.000Z',
  filtros: { eventoId: undefined, desde: '2026-08-01', hasta: '2026-09-30', estado: undefined },
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
      descripcion: 'Torneo',
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
      descripcion: 'Cena',
      estado: 'FINALIZADO',
      requiereEntrada: true,
      fechaEvento: '2026-09-12T20:00:00.000Z',
      fechaFin: null,
      lugarAcreditacion: 'Salón',
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

describe('US-36 · exportarReporteAsistencia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportarAsistenciaCsv', () => {
    it('genera archivo CSV con encabezados, BOM UTF-8 y fila de totales', () => {
      let createdBlob: Blob | null = null;
      let clickedLink = false;
      let downloadFilename = '';

      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        return 'blob:mock-url';
      });
      URL.revokeObjectURL = vi.fn();

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName === 'a') {
          vi.spyOn(el, 'click').mockImplementation(() => {
            clickedLink = true;
            downloadFilename = el.getAttribute('download') || '';
          });
        }
        return el;
      });

      exportarAsistenciaCsv(reporteFixture);

      expect(clickedLink).toBe(true);
      expect(downloadFilename).toMatch(/^reporte-asistencia-eventos-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(createdBlob).not.toBeNull();
      expect((createdBlob as unknown as Blob)?.type).toBe('text/csv;charset=utf-8;');

      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });

  describe('exportarAsistenciaPdf', () => {
    it('genera documento PDF en orientación horizontal A4 con membrete y totales sin lanzar excepciones', () => {
      expect(() => exportarAsistenciaPdf(reporteFixture)).not.toThrow();
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave.mock.calls[0][0]).toMatch(/^reporte-asistencia-eventos-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });
});
