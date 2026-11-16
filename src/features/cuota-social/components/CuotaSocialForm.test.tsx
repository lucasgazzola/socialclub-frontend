import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CuotaSocialForm } from './CuotaSocialForm';

const mockCategorias = [
  { id: 1, nombre: 'Activo', descripcion: null },
  { id: 2, nombre: 'Cadete', descripcion: null },
];

describe('CuotaSocialForm', () => {
  it('renderiza campos habilitados en modo crear y permite cancelar', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <CuotaSocialForm
        modo="crear"
        categorias={mockCategorias}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    );

    expect(screen.getByRole('button', { name: 'Configurar cuota social' })).toBeInTheDocument();
    const categoriaSelect = screen.getByRole('combobox');
    expect(categoriaSelect).not.toBeDisabled();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('renderiza con campos deshabilitados (categoria y periodo) en modo editar', () => {
    const handleSubmit = vi.fn();

    render(
      <CuotaSocialForm
        modo="editar"
        categorias={mockCategorias}
        configuracionInicial={{
          id: 10,
          categoriaId: 1,
          categoria: { id: 1, nombre: 'Activo' },
          monto: 8500,
          periodoAplicacion: '2026-06',
          activo: true,
          creadoEn: '2026-01-01',
          actualizadoEn: '2026-01-01',
        }}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Período de aplicación')).toBeDisabled();
    expect(screen.getByLabelText('Monto mensual ($)')).toHaveValue(8500);
  });

  it('valida campos y envía datos en modo crear', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CuotaSocialForm
        modo="crear"
        categorias={mockCategorias}
        onSubmit={handleSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: 'Configurar cuota social' });
    await user.click(submitBtn);

    // Debe mostrar error si no se completó categoria o monto
    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    await user.selectOptions(screen.getByRole('combobox'), '1');
    const montoInput = screen.getByLabelText('Monto mensual ($)');
    await user.type(montoInput, '5000');

    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          categoriaId: 1,
          monto: 5000,
        }),
        expect.anything(),
      );
    });
  });
});
