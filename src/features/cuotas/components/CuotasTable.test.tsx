import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CuotasTable } from './CuotasTable';
import type { ConfiguracionCuotaDeportiva } from '../types';

const tarifa = (id: number, activo: boolean, categoria: string | null): ConfiguracionCuotaDeportiva =>
  ({
    id,
    disciplina: { id: 1, nombre: 'Fútbol' },
    categoriaDisciplina: categoria ? { id: 10, nombre: categoria } : null,
    monto: 10000,
    descuentoSocioPorcentaje: 0,
    periodoAplicacion: '2026-04',
    activo,
  }) as unknown as ConfiguracionCuotaDeportiva;

describe('DT-05 · CuotasTable · activar y desactivar', () => {
  it('ofrece Desactivar en las activas y Activar en las inactivas', async () => {
    const user = userEvent.setup();
    const onCambiarEstado = vi.fn();
    const activa = tarifa(1, true, 'Juveniles');
    render(
      <CuotasTable cuotas={[activa, tarifa(2, false, null)]} onEditar={vi.fn()} onCambiarEstado={onCambiarEstado} />,
    );

    const [filaActiva, filaInactiva] = screen.getAllByRole('row').slice(1);
    expect(within(filaActiva).getByText('Activa')).toBeInTheDocument();
    expect(within(filaInactiva).getByText('Inactiva')).toBeInTheDocument();
    expect(
      within(filaInactiva).getByRole('button', { name: 'Activar la tarifa de Fútbol desde 04/2026' }),
    ).toBeInTheDocument();

    await user.click(
      within(filaActiva).getByRole('button', { name: 'Desactivar la tarifa de Fútbol · Juveniles desde 04/2026' }),
    );
    expect(onCambiarEstado).toHaveBeenCalledWith(activa);
  });

  it('sin onCambiarEstado no muestra la acción', () => {
    render(<CuotasTable cuotas={[tarifa(1, true, null)]} onEditar={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /desactivar/i })).not.toBeInTheDocument();
  });
});
