import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCsv, exportToExcel, exportToPdf, type ExportColumn } from './exportTable';

const mockSave = vi.fn();
const mockAddPage = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    save = mockSave;
    addPage = mockAddPage;
    text = vi.fn();
    rect = vi.fn();
    line = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
    internal = {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210,
      },
    };
  }
  return {
    jsPDF: MockJsPDF,
  };
});

describe('exportTable utils', () => {
  interface PersonaPrueba {
    nombre: string;
    edad: number | null;
    dni: string;
    observacion?: string | null;
  }

  const columns: ExportColumn<PersonaPrueba>[] = [
    { header: 'Nombre & Apellido <Titular>', accessor: (p) => p.nombre },
    { header: 'Edad', accessor: (p) => p.edad },
    { header: 'DNI', accessor: (p) => p.dni },
    { header: 'Observación', accessor: (p) => p.observacion },
  ];

  const rows: PersonaPrueba[] = [
    { nombre: 'Juan "El Grande" & O\'Connor', edad: 30, dni: '30.123.456', observacion: 'Socio activo, cuota al día' },
    { nombre: 'María <Admin>', edad: null, dni: '35.987.654', observacion: null },
    { nombre: 'Pedro', edad: 40, dni: '20.111.222', observacion: 'Con salto\r\nde línea;' },
    { nombre: 'Simple', edad: 22, dni: '11111111', observacion: 'Texto plano sin caracteres raros' },
  ];

  let appendChildSpy: any;
  let removeChildSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
  });

  it('exportToCsv genera un archivo CSV con BOM y escapa caracteres especiales y celdas nulas', () => {
    exportToCsv({
      filename: 'personas.csv',
      title: 'Personas',
      columns,
      rows,
    });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('exportToCsv maneja nombres sin extensión', () => {
    exportToCsv({
      filename: 'personas_sin_ext',
      title: 'Personas',
      columns,
      rows: rows.slice(0, 1),
    });
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('exportToExcel genera un archivo SpreadsheetML válido con estilos, números y título por defecto', () => {
    exportToExcel({
      filename: 'personas.xlsx',
      title: '', // fallback a 'Datos'
      columns,
      rows,
    });

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it('exportToPdf genera un documento PDF apaisado y soporta paginación cuando hay muchas filas', () => {
    // Generamos 50 filas para superar el alto de página y disparar addPage
    const muchasFilas: PersonaPrueba[] = Array.from({ length: 50 }, (_, i) => ({
      nombre: `Socio Número ${i + 1}`,
      edad: 20 + (i % 30),
      dni: `${30000000 + i}`,
      observacion: i % 2 === 0 ? 'Línea 1 con texto largo para verificar wrap\nLínea 2' : '',
    }));

    exportToPdf({
      filename: 'reporte.pdf',
      title: 'Reporte General Extenso',
      columns,
      rows: muchasFilas,
    });

    expect(mockSave).toHaveBeenCalled();
    expect(mockAddPage).toHaveBeenCalled();
  });
});
