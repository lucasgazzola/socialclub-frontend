import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeeForm } from './FeeForm';
import type { MemberCategory, Discipline } from '../types';

const disciplinas: Discipline[] = [
  { id: 1, name: 'Fútbol', active: true, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 2, name: 'Vóley', active: true, createdAt: '2026-08-06T00:00:00.000Z' },
];

const categorias: MemberCategory[] = [
  { id: 1, name: 'Juvenil' },
  { id: 2, name: 'Infantil' },
];

describe('FeeForm', () => {
  it('impide visualmente guardar un monto menor o igual a cero', async () => {
    const onSubmit = vi.fn();
    render(
      <FeeForm
        modo="crear"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Discipline'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar cuota' }));

    expect(await screen.findByText('El monto debe ser mayor a cero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía la configuración cuando el monto es mayor a cero', async () => {
    const onSubmit = vi.fn();
    render(
      <FeeForm
        modo="crear"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Discipline'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '2');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '12000');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar cuota' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ disciplineId: 2, categoryId: 2, amount: 12000 }),
      expect.anything(),
    );
  });

  it('bloquea los selectores y el período cuando se edita', () => {
    const onSubmit = vi.fn();
    render(
      <FeeForm
        modo="editar"
        disciplinas={disciplinas}
        categorias={categorias}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText('Discipline')).toBeDisabled();
    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    expect(screen.getByLabelText('Período de aplicación')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });
});
