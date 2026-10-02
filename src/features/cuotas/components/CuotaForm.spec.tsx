import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CuotaForm } from './CuotaForm';
import type { ConfiguracionCuotaDeportiva, Disciplina } from '../types';

const disciplinas: Disciplina[] = [
  {
    id: 1,
    nombre: 'Fútbol',
    activo: true,
    creadoEn: '2026-08-06T00:00:00.000Z',
    categorias: [
      { id: 7, nombre: 'Sub-15', activo: true },
      { id: 8, nombre: 'Reserva', activo: false },
    ],
  },
  { id: 2, nombre: 'Vóley', activo: true, creadoEn: '2026-08-06T00:00:00.000Z', categorias: [] },
];

/** US-20 · TASK-33 — Tarifa por disciplina o categoría, con descuento para socios. */
describe('CuotaForm', () => {
  it('impide visualmente guardar un monto menor o igual a cero', async () => {
    const onSubmit = vi.fn();
    render(<CuotaForm modo="crear" disciplinas={disciplinas} onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar tarifa' }));

    expect(await screen.findByText('El monto debe ser mayor a cero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía la tarifa base de la disciplina (sin categoría) con su descuento para socios', async () => {
    const onSubmit = vi.fn();
    render(<CuotaForm modo="crear" disciplinas={disciplinas} onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '12000');
    await userEvent.clear(screen.getByLabelText('Descuento para socios (%)'));
    await userEvent.type(screen.getByLabelText('Descuento para socios (%)'), '25');

    expect(screen.getByText(/Un socio paga/)).toHaveTextContent('Un socio paga $ 9.000,00 por mes');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar tarifa' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinaId: 2, categoriaDisciplinaId: undefined, monto: 12000, descuentoSocioPorcentaje: 25 }),
      expect.anything(),
    );
  });

  it('ofrece solo las categorías activas de la disciplina elegida', async () => {
    const onSubmit = vi.fn();
    render(<CuotaForm modo="crear" disciplinas={disciplinas} onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '1');

    const opciones = [...(screen.getByLabelText('Categoría') as HTMLSelectElement).options].map((o) => o.text);
    expect(opciones).toEqual(['Toda la disciplina (tarifa base)', 'Sub-15']);

    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '7');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '8000');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar tarifa' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ disciplinaId: 1, categoriaDisciplinaId: 7, monto: 8000, descuentoSocioPorcentaje: 0 }),
      expect.anything(),
    );
  });

  it('rechaza un descuento mayor a 100 %', async () => {
    const onSubmit = vi.fn();
    render(<CuotaForm modo="crear" disciplinas={disciplinas} onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await userEvent.type(screen.getByLabelText('Monto mensual ($)'), '12000');
    await userEvent.clear(screen.getByLabelText('Descuento para socios (%)'));
    await userEvent.type(screen.getByLabelText('Descuento para socios (%)'), '150');
    await userEvent.click(screen.getByRole('button', { name: 'Configurar tarifa' }));

    expect(await screen.findByText('El descuento no puede superar el 100 %')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('en edición bloquea disciplina, categoría y período, y deja editar monto y descuento', () => {
    const tarifa: ConfiguracionCuotaDeportiva = {
      id: 3,
      disciplinaId: 1,
      categoriaDisciplinaId: 7,
      periodoAplicacion: '2026-09',
      monto: 8000,
      descuentoSocioPorcentaje: 10,
      activo: true,
      creadoEn: '',
      actualizadoEn: '',
      disciplina: { id: 1, nombre: 'Fútbol' },
      categoriaDisciplina: { id: 7, nombre: 'Sub-15' },
    };
    render(<CuotaForm modo="editar" configuracionInicial={tarifa} disciplinas={disciplinas} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Disciplina')).toBeDisabled();
    expect(screen.getByLabelText('Categoría')).toBeDisabled();
    expect(screen.getByLabelText('Categoría')).toHaveValue('7');
    expect(screen.getByLabelText('Rige desde')).toBeDisabled();
    expect(screen.getByLabelText('Monto mensual ($)')).toBeEnabled();
    expect(screen.getByLabelText('Descuento para socios (%)')).toHaveValue(10);
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });
});
