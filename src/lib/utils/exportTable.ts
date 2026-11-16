import { jsPDF } from 'jspdf';

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export interface ExportOptions<T> {
  filename: string;
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function escapeXml(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Descarga todas las filas indicadas como archivo CSV con BOM UTF-8 (compatible con Excel).
 */
export function exportToCsv<T>({ filename, columns, rows }: ExportOptions<T>): void {
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(col.accessor(row))).join(','),
  );
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  triggerDownload(blob, `${cleanName}.csv`);
}

/**
 * Descarga todas las filas indicadas como planilla de Excel (.xlsx / SpreadsheetML).
 */
export function exportToExcel<T>({ filename, title, columns, rows }: ExportOptions<T>): void {
  const headerCells = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`,
    )
    .join('');

  const dataRows = rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const val = col.accessor(row);
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<Cell><Data ss:Type="Number">${val}</Data></Cell>`;
          }
          return `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const sheetName = escapeXml(title.slice(0, 31) || 'Datos');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
  });
  const cleanName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  triggerDownload(blob, `${cleanName}.xlsx`);
}

/**
 * Genera y descarga un documento PDF horizontal con diseño tabular limpio usando jsPDF.
 */
export function exportToPdf<T>({ filename, title, columns, rows }: ExportOptions<T>): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const usableWidth = pageWidth - marginX * 2;
  const colWidth = usableWidth / Math.max(1, columns.length);

  // Encabezado del documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Exportado el ${new Date().toLocaleString('es-AR')} · ${rows.length} registro(s)`,
    marginX,
    20,
  );

  let y = 26;

  const drawTableHeader = (posY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, posY, usableWidth, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    columns.forEach((col, i) => {
      const cellX = marginX + i * colWidth + 2;
      const truncated = doc.splitTextToSize(col.header.toUpperCase(), colWidth - 4)[0] ?? '';
      doc.text(String(truncated), cellX, posY + 5.2);
    });
    return posY + 8;
  };

  y = drawTableHeader(y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  rows.forEach((row, rowIndex) => {
    const cellLines = columns.map((col) => {
      const raw = col.accessor(row);
      const text = raw === null || raw === undefined || raw === '' ? '—' : String(raw);
      const lines = doc.splitTextToSize(text, colWidth - 4) as string[];
      return lines.slice(0, 2);
    });

    const maxLines = Math.max(1, ...cellLines.map((l) => l.length));
    const rowHeight = Math.max(7, maxLines * 4 + 2.5);

    if (y + rowHeight > pageHeight - 12) {
      doc.addPage('a4', 'landscape');
      y = 14;
      y = drawTableHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, usableWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, y + rowHeight, marginX + usableWidth, y + rowHeight);

    cellLines.forEach((lines, colIndex) => {
      const cellX = marginX + colIndex * colWidth + 2;
      doc.text(lines, cellX, y + 4.5);
    });

    y += rowHeight;
  });

  const cleanName = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  doc.save(`${cleanName}.pdf`);
}
