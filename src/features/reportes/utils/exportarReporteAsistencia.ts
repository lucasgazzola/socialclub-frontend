import { jsPDF } from 'jspdf';
import { type ReporteAsistenciaEventos } from '../types';

const pesos = (n: number) =>
  `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const porcentaje = (p: number | null) =>
  p === null ? '—' : `${p.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;

/** Exporta los datos consolidados del reporte a un archivo CSV compatible con Excel (UTF-8 con BOM). */
export function exportarAsistenciaCsv(reporte: ReporteAsistenciaEventos) {
  const encabezados = [
    'Evento',
    'Estado',
    'Fecha',
    'Lugar',
    'Capacidad Máxima',
    'Entradas Vendidas',
    'Ingresos Validados (Asistentes)',
    'Ausentes (No-Show)',
    '% Asistencia',
    '% Ocupación',
    'Recaudado (ARS)',
  ];

  const filas = reporte.eventos.map((ev) => [
    `"${ev.nombre.replace(/"/g, '""')}"`,
    ev.estado,
    new Date(ev.fechaEvento).toLocaleDateString('es-AR'),
    `"${(ev.lugarAcreditacion || '').replace(/"/g, '""')}"`,
    ev.capacidadMaxima ?? '—',
    ev.totalEntradas,
    ev.ingresosValidados,
    ev.ausentes,
    porcentaje(ev.porcentajeAsistencia),
    porcentaje(ev.porcentajeOcupacion),
    ev.recaudado,
  ]);

  // Fila de totales al final
  const filaTotales = [
    '"TOTALES GENERALES"',
    '',
    '',
    '',
    reporte.totales.totalCapacidad,
    reporte.totales.totalEntradas,
    reporte.totales.totalAsistentes,
    reporte.totales.totalAusentes,
    porcentaje(reporte.totales.porcentajeAsistenciaPromedio),
    porcentaje(reporte.totales.porcentajeOcupacionPromedio),
    reporte.totales.totalRecaudado,
  ];

  const contenidoCsv =
    '\uFEFF' +
    [encabezados.join(';'), ...filas.map((f) => f.join(';')), filaTotales.join(';')].join('\r\n');

  const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const hoy = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `reporte-asistencia-eventos-${hoy}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Genera y descarga un reporte oficial en formato PDF en orientación apaisada (Landscape). */
export function exportarAsistenciaPdf(reporte: ReporteAsistenciaEventos) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const fechaGeneracion = new Date(reporte.generadoEn).toLocaleString('es-AR');

  // Cabecera institucional
  doc.setFillColor(37, 99, 235); // Brand blue
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SocialClub — Reporte Ejecutivo de Asistencia y Ocupación de Eventos', 14, 12);

  // Subcabecera
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el: ${fechaGeneracion} | Total de eventos analizados: ${reporte.totales.totalEventos}`, 14, 25);

  // Tarjetas KPI de resumen
  const kpiY = 30;
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { label: 'ASISTENTES TOTALES', val: `${reporte.totales.totalAsistentes}`, sub: `${porcentaje(reporte.totales.porcentajeAsistenciaPromedio)} asistencia prom.` },
    { label: 'ENTRADAS VENDIDAS', val: `${reporte.totales.totalEntradas}`, sub: `Recaudado: ${pesos(reporte.totales.totalRecaudado)}` },
    { label: 'OCUPACIÓN PROMEDIO', val: `${porcentaje(reporte.totales.porcentajeOcupacionPromedio)}`, sub: `${reporte.totales.totalAsistentes} de ${reporte.totales.totalCapacidad} plazas` },
    { label: 'NO-SHOW (AUSENTES)', val: `${reporte.totales.totalAusentes}`, sub: `${reporte.totales.totalEntradas > 0 ? (100 - (reporte.totales.porcentajeAsistenciaPromedio ?? 0)).toFixed(1) : 0}% no asistieron` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiY, cardWidth, 18, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, kpiY + 5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + 4, kpiY + 11.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 4, kpiY + 15.5);
  });

  // Tabla de eventos
  let startY = 54;
  const headers = [
    { text: 'Evento', width: 62 },
    { text: 'Estado', width: 22 },
    { text: 'Fecha', width: 22 },
    { text: 'Lugar', width: 45 },
    { text: 'Cap.', width: 14, align: 'right' as const },
    { text: 'Vend.', width: 16, align: 'right' as const },
    { text: 'Asist.', width: 16, align: 'right' as const },
    { text: 'Aus.', width: 14, align: 'right' as const },
    { text: '% Asist.', width: 18, align: 'right' as const },
    { text: '% Ocup.', width: 18, align: 'right' as const },
    { text: 'Recaudado', width: 24, align: 'right' as const },
  ];

  // Header tabla
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  let currentX = 14;
  headers.forEach((h) => {
    if (h.align === 'right') {
      doc.text(h.text, currentX + h.width - 2, startY + 4.8, { align: 'right' });
    } else {
      doc.text(h.text, currentX + 2, startY + 4.8);
    }
    currentX += h.width;
  });

  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  reporte.eventos.forEach((ev, idx) => {
    if (startY > 185) {
      doc.addPage();
      startY = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, startY, pageWidth - 28, 6.5, 'F');
    }

    doc.setTextColor(30, 41, 59);
    let rowX = 14;

    // Truncar textos largos si es necesario
    const nombreTruncado = ev.nombre.length > 34 ? `${ev.nombre.slice(0, 32)}...` : ev.nombre;
    const lugarTruncado =
      (ev.lugarAcreditacion || '').length > 25
        ? `${(ev.lugarAcreditacion || '').slice(0, 23)}...`
        : ev.lugarAcreditacion || '—';

    doc.text(nombreTruncado, rowX + 2, startY + 4.3);
    rowX += headers[0].width;

    doc.text(ev.estado, rowX + 2, startY + 4.3);
    rowX += headers[1].width;

    doc.text(new Date(ev.fechaEvento).toLocaleDateString('es-AR'), rowX + 2, startY + 4.3);
    rowX += headers[2].width;

    doc.text(lugarTruncado, rowX + 2, startY + 4.3);
    rowX += headers[3].width;

    doc.text(String(ev.capacidadMaxima ?? '—'), rowX + headers[4].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[4].width;

    doc.text(String(ev.totalEntradas), rowX + headers[5].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[5].width;

    doc.text(String(ev.ingresosValidados), rowX + headers[6].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[6].width;

    doc.text(String(ev.ausentes), rowX + headers[7].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[7].width;

    doc.text(porcentaje(ev.porcentajeAsistencia), rowX + headers[8].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[8].width;

    doc.text(porcentaje(ev.porcentajeOcupacion), rowX + headers[9].width - 2, startY + 4.3, { align: 'right' });
    rowX += headers[9].width;

    doc.text(pesos(ev.recaudado), rowX + headers[10].width - 2, startY + 4.3, { align: 'right' });

    startY += 6.5;
  });

  // Fila final de totales
  doc.setFillColor(226, 232, 240);
  doc.rect(14, startY, pageWidth - 28, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  let totX = 14;
  doc.text('TOTALES CONSOLIDADOS', totX + 2, startY + 5);
  totX += headers[0].width + headers[1].width + headers[2].width + headers[3].width;

  doc.text(String(reporte.totales.totalCapacidad), totX + headers[4].width - 2, startY + 5, { align: 'right' });
  totX += headers[4].width;

  doc.text(String(reporte.totales.totalEntradas), totX + headers[5].width - 2, startY + 5, { align: 'right' });
  totX += headers[5].width;

  doc.text(String(reporte.totales.totalAsistentes), totX + headers[6].width - 2, startY + 5, { align: 'right' });
  totX += headers[6].width;

  doc.text(String(reporte.totales.totalAusentes), totX + headers[7].width - 2, startY + 5, { align: 'right' });
  totX += headers[7].width;

  doc.text(porcentaje(reporte.totales.porcentajeAsistenciaPromedio), totX + headers[8].width - 2, startY + 5, { align: 'right' });
  totX += headers[8].width;

  doc.text(porcentaje(reporte.totales.porcentajeOcupacionPromedio), totX + headers[9].width - 2, startY + 5, { align: 'right' });
  totX += headers[9].width;

  doc.text(pesos(reporte.totales.totalRecaudado), totX + headers[10].width - 2, startY + 5, { align: 'right' });

  // Pie de página
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Documento oficial generado por el Módulo de Reportes de SocialClub. Válido para auditoría y toma de decisiones.', 14, doc.internal.pageSize.getHeight() - 8);

  const hoy = new Date().toISOString().slice(0, 10);
  doc.save(`reporte-asistencia-eventos-${hoy}.pdf`);
}
