import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableExportMenu } from './TableExportMenu';
import * as exportUtils from '@/lib/utils/exportTable';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('TableExportMenu', () => {
  const columns = [{ header: 'Nombre', accessor: (r: { nombre: string }) => r.nombre }];
  const mockRows = [{ nombre: 'Juan' }, { nombre: 'María' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el menú al hacer clic y cierra al presionar Escape', () => {
    render(
      <TableExportMenu
        filename="test"
        title="Test"
        columns={columns}
        fetchRows={() => mockRows}
      />,
    );

    const button = screen.getByRole('button', { name: /Exportar/i });
    fireEvent.click(button);
    expect(screen.getByText(/Excel \(\.xlsx\)/i)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/Excel \(\.xlsx\)/i)).not.toBeInTheDocument();
  });

  it('exporta a Excel, CSV y PDF correctamente', async () => {
    const excelSpy = vi.spyOn(exportUtils, 'exportToExcel').mockImplementation(() => {});
    const csvSpy = vi.spyOn(exportUtils, 'exportToCsv').mockImplementation(() => {});
    const pdfSpy = vi.spyOn(exportUtils, 'exportToPdf').mockImplementation(() => {});

    render(
      <TableExportMenu
        filename="test"
        title="Test"
        columns={columns}
        fetchRows={() => mockRows}
      />,
    );

    // Exportar Excel
    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    fireEvent.click(screen.getByText(/Excel \(\.xlsx\)/i));
    await waitFor(() => expect(excelSpy).toHaveBeenCalled());

    // Exportar CSV
    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    fireEvent.click(screen.getByText(/CSV \(\.csv\)/i));
    await waitFor(() => expect(csvSpy).toHaveBeenCalled());

    // Exportar PDF
    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    fireEvent.click(screen.getByText(/Imprimir \/ Guardar PDF/i));
    await waitFor(() => expect(pdfSpy).toHaveBeenCalled());
  });

  it('muestra toast info si no hay registros para exportar', async () => {
    render(
      <TableExportMenu
        filename="test"
        title="Test"
        columns={columns}
        fetchRows={() => []}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    fireEvent.click(screen.getByText(/Excel \(\.xlsx\)/i));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('No hay registros que coincidan para exportar.');
    });
  });

  it('muestra toast error si falla el fetchRows', async () => {
    render(
      <TableExportMenu
        filename="test"
        title="Test"
        columns={columns}
        fetchRows={() => {
          throw new Error('Error al cargar');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    fireEvent.click(screen.getByText(/Excel \(\.xlsx\)/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo exportar el listado. Intentá nuevamente.');
    });
  });

  it('cierra el menú al hacer clic fuera del componente', () => {
    render(
      <div>
        <div data-testid="outside">Afuera</div>
        <TableExportMenu
          filename="test"
          title="Test"
          columns={columns}
          fetchRows={() => mockRows}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    expect(screen.getByText(/Excel \(\.xlsx\)/i)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText(/Excel \(\.xlsx\)/i)).not.toBeInTheDocument();
  });

  it('respeta la prop disabled y no abre el menú', () => {
    render(
      <TableExportMenu
        filename="test"
        title="Test"
        columns={columns}
        fetchRows={() => mockRows}
        disabled={true}
      />,
    );

    const button = screen.getByRole('button', { name: /Exportar/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(screen.queryByText(/Excel \(\.xlsx\)/i)).not.toBeInTheDocument();
  });
});
