import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CuotaForm } from './CuotaForm';
import type { CategoriaSocio, Disciplina } from '../types';

const disciplinas: Disciplina[] = [
  { id: 1, nombre: 'Fútbol', activo: true, creadoEn: '2026-08-06T00:00:00.000Z' },
  { id: 2, nombre: 'Vóley', activo: true, creadoEn: '2026-08-06T00:00:00.000Z' },
];

const categorias: CategoriaSocio[] = [
  { id: 1, nombre: 'Juvenil' },
  { id: 2, nombre: 'Infantil' },
];

describe('CuotaForm', () => {
  it('impide visualmente guardar un monto menor o igual a cero', async () => {
    const onSubmit = vi.fn();
    render(
      <CuotaForm
        modo="crear"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar cuota' }));

    expect(await screen.findByText('El monto debe ser mayor a cero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía la configuración cuando el monto es mayor a cero', async () => {
    const onSubmit = vi.fn();
    render(
      <CuotaForm
        modo="crear"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '2');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '12000');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar cuota' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinaId: 2, categoriaId: 2, monto: 12000 }),
      expect.anything(),
    );
  });

  it('bloquea los selectores y el período cuando se edita', () => {
    const onSubmit = vi.fn();
    render(
      <CuotaForm
        modo="editar"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('Disciplina')).toBeDisabled();
    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    expect(screen.getByLabelText('Período de aplicación')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });
});
