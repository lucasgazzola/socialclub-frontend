import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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

describe('US-33 · AuditoriaTable', () => {
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
    expect(screen.getByText('Alta de nuevo socio')).toBeInTheDocument();
    expect(screen.getByText('Desactivación de cuenta')).toBeInTheDocument();
  });

  it('muestra guion cuando el registro no tiene responsable', () => {
    render(<AuditoriaTable registros={[FIXTURE_REGISTROS[1]]} />);
    // Columnas ID=5, responsable=—
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
