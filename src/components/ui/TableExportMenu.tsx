import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from '@/lib/utils/exportTable';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface TableExportMenuProps<T> {
  /** Nombre base del archivo descargado (sin extensión). */
  filename: string;
  /** Título del reporte para la hoja de Excel y cabecera del PDF. */
  title: string;
  /** Definición de columnas a exportar. */
  columns: ExportColumn<T>[];
  /** Función asíncrona o síncrona que devuelve todas las filas que coinciden con los filtros activos. */
  fetchRows: () => Promise<T[]> | T[];
  /** Deshabilita el botón cuando la tabla está cargando o sin permisos. */
  disabled?: boolean;
  className?: string;
}

/**
 * Botón "Export" con menú desplegable ("Export all matching rows": Excel, CSV, Print / Save as PDF).
 */
export function TableExportMenu<T>({
  filename,
  title,
  columns,
  fetchRows,
  disabled = false,
  className,
}: TableExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleExport(format: ExportFormat) {
    if (exporting) return;
    setOpen(false);
    setExporting(true);
    try {
      const rows = await fetchRows();
      if (!rows || rows.length === 0) {
        toast.info('No hay registros que coincidan para exportar.');
        return;
      }

      const options = { filename, title, columns, rows };
      if (format === 'xlsx') {
        exportToExcel(options);
      } else if (format === 'csv') {
        exportToCsv(options);
      } else {
        exportToPdf(options);
      }
    } catch {
      toast.error('No se pudo exportar el listado. Intentá nuevamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block shrink-0', className)}>
      <button
        type="button"
        disabled={disabled || exporting}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-9.5 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-sm font-normal text-slate-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-all select-none cursor-pointer',
          'hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Download size={16} className="text-slate-400 shrink-0" />
        <span>Exportar</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Opciones de exportación"
          className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-lg ring-1 ring-slate-900/5"
        >
          <div className="px-3.5 py-2 text-xs font-semibold text-slate-900">
            Exportar filas filtradas
          </div>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleExport('xlsx')}
            className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-slate-400 shrink-0" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleExport('csv')}
            className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <FileText size={16} className="text-slate-400 shrink-0" />
            <span>CSV (.csv)</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleExport('pdf')}
            className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <Printer size={16} className="text-slate-400 shrink-0" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
