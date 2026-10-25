import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuditoriaTable } from './AuditoriaTable';
import type { RegistroAuditoria } from '../types';

const FIXTURE_REGISTROS: RegistroAuditoria[] = [
  {
    id: 1,
    fechaHora: '2026-03-15T14:30:00.000Z',
    accion: 'CREAR',
    entidad: 'Socio',
    idEntidad: 10,
    responsable: {
      id: 2,
      nombre: 'Carlos',
      apellido: 'Gómez',
      email: 'carlos@club.com',
    },
    detalle: 'Alta de nuevo socio',
  },
  {
    id: 2,
    fechaHora: '2026-03-15T15:00:00.000Z',
    accion: 'BAJA',
    entidad: 'Usuario',
    idEntidad: 5,
    detalle: 'Desactivación de cuenta',
  },
];

describe('US-33 / TASK-47 · AuditoriaTable', () => {
  it('muestra mensaje cuando no hay registros de auditoría', () => {
    render(<AuditoriaTable registros={[]} />);
    expect(
      screen.getByText(/no se encontraron registros de auditoría/i),
    ).toBeInTheDocument();
  });

  it('renderiza la lista de registros con sus columnas y badges correspondientes', () => {
    render(<AuditoriaTable registros={FIXTURE_REGISTROS} />);

    expect(screen.getByText('CREAR')).toBeInTheDocument();
    expect(screen.getByText('BAJA')).toBeInTheDocument();
    expect(screen.getByText('Socio')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Carlos Gómez')).toBeInTheDocument();
    
    expect(screen.getAllByText('Alta de nuevo socio')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Desactivación de cuenta')[0]).toBeInTheDocument();
  });

  it('muestra guion cuando el registro no tiene responsable', () => {
    render(<AuditoriaTable registros={[FIXTURE_REGISTROS[1]]} />);
    // Columnas ID=5, responsable=—
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('cuenta con encabezado sticky y contenedor con scroll vertical delimitado (DT-10)', () => {
    const { container } = render(<AuditoriaTable registros={FIXTURE_REGISTROS} />);

    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveClass('overflow-y-auto');

    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveClass('sticky');
    expect(thead).toHaveClass('top-0');
  });

  it('dispara onOrdenar con el campo correspondiente al hacer clic en los encabezados', async () => {
    const user = userEvent.setup();
    const onOrdenar = vi.fn();
    render(<AuditoriaTable registros={FIXTURE_REGISTROS} onOrdenar={onOrdenar} />);

    await user.click(screen.getByRole('button', { name: /^Fecha y hora$/i }));
    expect(onOrdenar).toHaveBeenCalledWith('fecha');

    await user.click(screen.getByRole('button', { name: /^Acción$/i }));
    expect(onOrdenar).toHaveBeenCalledWith('accion');

    await user.click(screen.getByRole('button', { name: /^Entidad$/i }));
    expect(onOrdenar).toHaveBeenCalledWith('entidad');

    await user.click(screen.getByRole('button', { name: /^ID$/i }));
    expect(onOrdenar).toHaveBeenCalledWith('entidadId');

    await user.click(screen.getByRole('button', { name: /^Responsable$/i }));
    expect(onOrdenar).toHaveBeenCalledWith('responsable');
  });

  it('ordena en memoria cuando se especifican ordenarPor y orden', () => {
    const { rerender } = render(
      <AuditoriaTable registros={FIXTURE_REGISTROS} ordenarPor="accion" orden="asc" />,
    );
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('BAJA');
    expect(rows[2]).toHaveTextContent('CREAR');

    rerender(
      <AuditoriaTable registros={FIXTURE_REGISTROS} ordenarPor="accion" orden="desc" />,
    );
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('CREAR');
    expect(rows[2]).toHaveTextContent('BAJA');
  });
});
