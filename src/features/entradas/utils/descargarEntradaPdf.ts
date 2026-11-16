import { jsPDF } from 'jspdf';
import QRCodeLib from 'qrcode';
import type { Entrada } from '../types';
import { isoADisplay } from '@/lib/utils/fecha';

/**
 * Agrega una página con el diseño de una entrada al documento jsPDF.
 */
async function agregarPaginaEntrada(doc: jsPDF, entrada: Entrada, eventoNombre?: string): Promise<void> {
  const nombreEvento = entrada.evento?.nombre ?? eventoNombre ?? 'Evento';
  const qrDataUrl = await QRCodeLib.toDataURL(entrada.token, {
    width: 400,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // Borde y fondo estilo credencial (A6: 105 x 148 mm)
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(7, 7, 91, 134, 4, 4, 'FD');

  // Nombre del evento (ajustado en ancho para no desbordar)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  const lineasTitulo = doc.splitTextToSize(nombreEvento, 78);
  doc.text(lineasTitulo, 52.5, 26, { align: 'center' });

  let posY = 26 + lineasTitulo.length * 5.5;

  if (entrada.creadoEn) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Emitida el ${isoADisplay(entrada.creadoEn)}`, 52.5, posY, { align: 'center' });
    posY += 5;
  }

  // Línea separadora punteada superior
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14, posY + 3, 91, posY + 3);
  doc.setLineDashPattern([], 0);

  // Código QR centrado
  const tamanoQR = 58;
  const qrX = (105 - tamanoQR) / 2;
  const qrY = posY + 9;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, tamanoQR, tamanoQR);

  // Línea separadora punteada inferior
  const sepInferiorY = qrY + tamanoQR + 9;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14, sepInferiorY, 91, sepInferiorY);
  doc.setLineDashPattern([], 0);

  // Pie de entrada
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Presentá este código QR en el acceso al evento.', 52.5, sepInferiorY + 8, { align: 'center' });
}

/**
 * Genera el documento PDF con una o más entradas (una página por entrada).
 */
export async function generarEntradasPdf(entradas: Entrada[], eventoNombre?: string): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6',
  });

  for (let i = 0; i < entradas.length; i++) {
    if (i > 0) {
      doc.addPage('a6', 'portrait');
    }
    await agregarPaginaEntrada(doc, entradas[i], eventoNombre);
  }

  return doc;
}

/**
 * Descarga una entrada individual en formato PDF.
 */
export async function descargarEntradaPdf(entrada: Entrada, eventoNombre?: string): Promise<void> {
  const doc = await generarEntradasPdf([entrada], eventoNombre);
  doc.save(`entrada-${entrada.token.slice(0, 8)}.pdf`);
}

/**
 * Descarga todas las entradas adquiridas en un solo archivo PDF de varias páginas.
 */
export async function descargarTodasEntradasPdf(entradas: Entrada[], eventoNombre?: string): Promise<void> {
  if (entradas.length === 0) return;
  const doc = await generarEntradasPdf(entradas, eventoNombre);
  const slug = (eventoNombre ?? entradas[0].evento?.nombre ?? 'evento')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  doc.save(`entradas-${slug || 'evento'}.pdf`);
}

/**
 * Descarga el código QR individual en formato imagen PNG.
 */
export async function descargarQR(entrada: Entrada): Promise<void> {
  const url = await QRCodeLib.toDataURL(entrada.token, { width: 300, margin: 2 });
  const link = document.createElement('a');
  link.href = url;
  link.download = `entrada-${entrada.token.slice(0, 8)}.png`;
  link.click();
}
