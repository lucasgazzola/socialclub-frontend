import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  descargarEntradaPdf,
  descargarQR,
  descargarTodasEntradasPdf,
  generarEntradasPdf,
} from './descargarEntradaPdf';
import type { Entrada } from '../types';

const mockSave = vi.fn();
const mockAddPage = vi.fn();
const mockText = vi.fn();
const mockAddImage = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    save = mockSave;
    addPage = mockAddPage;
    text = mockText;
    addImage = mockAddImage;
    roundedRect = mockRoundedRect;
    line = mockLine;
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    setLineDashPattern = vi.fn();
    splitTextToSize = vi.fn((text: string) => [text]);
  }
  return {
    jsPDF: MockJsPDF,
  };
});

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrdata'),
  },
}));

describe('DT-08 · descargarEntradaPdf utils', () => {
  const entrada1: Entrada = {
    id: 101,
    token: 'token-uuid-1234-abcd',
    eventoId: 1,
    estado: 'VALIDA',
    creadoEn: '2026-10-21T10:00:00.000Z',
    evento: {
      id: 1,
      nombre: 'Gran Fiesta Anual',
      entradasDisponibles: 10,
      entradasVendidas: 5,
      creadoEn: '2026-10-01',
      actualizadoEn: '2026-10-01',
    },
  };

  const entrada2: Entrada = {
    id: 102,
    token: 'token-uuid-5678-efgh',
    eventoId: 1,
    estado: 'VALIDA',
    creadoEn: '2026-10-21T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generarEntradasPdf genera documento con 1 página para una entrada', async () => {
    const doc = await generarEntradasPdf([entrada1]);
    expect(doc).toBeDefined();
    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockAddImage).toHaveBeenCalledTimes(1);
  });

  it('no incluye textos "SocialClub", "ENTRADA DE ACCESO", "Entrada # / Válida para 1 persona" ni ID/token', async () => {
    await generarEntradasPdf([entrada1]);
    const calls = mockText.mock.calls.map((c) => (Array.isArray(c[0]) ? c[0].join(' ') : String(c[0])));
    expect(calls.some((t) => t.includes('SocialClub'))).toBe(false);
    expect(calls.some((t) => t.includes('ENTRADA DE ACCESO'))).toBe(false);
    expect(calls.some((t) => t.includes('Válida para 1 persona'))).toBe(false);
    expect(calls.some((t) => t.includes('Entrada #'))).toBe(false);
    expect(calls.some((t) => t.includes(entrada1.token))).toBe(false);
    expect(calls.some((t) => t.includes(String(entrada1.id)))).toBe(false);
  });

  it('generarEntradasPdf agrega páginas para múltiples entradas', async () => {
    const doc = await generarEntradasPdf([entrada1, entrada2]);
    expect(doc).toBeDefined();
    expect(mockAddPage).toHaveBeenCalledTimes(1);
    expect(mockAddImage).toHaveBeenCalledTimes(2);
  });

  it('descargarEntradaPdf guarda el PDF con el nombre basado en el token', async () => {
    await descargarEntradaPdf(entrada1);
    expect(mockSave).toHaveBeenCalledWith('entrada-token-uu.pdf');
  });

  it('descargarTodasEntradasPdf guarda el PDF con el nombre del evento sanitizado', async () => {
    await descargarTodasEntradasPdf([entrada1, entrada2], 'Gran Fiesta Anual!');
    expect(mockSave).toHaveBeenCalledWith('entradas-gran-fiesta-anual.pdf');
  });

  it('descargarTodasEntradasPdf no hace nada si la lista está vacía', async () => {
    await descargarTodasEntradasPdf([]);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('descargarQR crea y ejecuta el enlace de descarga de imagen PNG', async () => {
    const clickSpy = vi.fn();
    const createElementOriginal = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = createElementOriginal(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await descargarQR(entrada1);

    expect(clickSpy).toHaveBeenCalled();
  });
});
