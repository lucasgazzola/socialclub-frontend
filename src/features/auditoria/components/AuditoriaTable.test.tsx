import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditoriaTable } from './AuditoriaTable';
import type { RegistroAuditoria } from '../types';

describe('AuditoriaTable', () => {
  it('muestra mensaje vacío cuando no hay registros', () => {
    render(<AuditoriaTable registros={[]} />);

    expect(screen.getByText('No se encontraron registros de auditoría.')).toBeInTheDocument();
  });

  it('renderiza la lista de registros con y sin responsable o detalle', () => {
    const registros: RegistroAuditoria[] = [
      {
        id: 1,
        fechaHora: '2026-03-01T10:30:00Z',
        accion: 'CREAR',
        entidad: 'Participante',
        idEntidad: 99,
        responsable: {
          id: 1,
          email: 'maria@test.com',
          nombre: 'María',
          apellido: 'García',
        },
        detalle: 'Inscripción a tenis',
      },
      {
        id: 2,
        fechaHora: '2026-03-01T11:00:00Z',
        accion: 'BAJA',
        entidad: 'Membresia',
        idEntidad: undefined,
        responsable: undefined,
        detalle: undefined,
      },
    ];

    render(<AuditoriaTable registros={registros} />);

    expect(screen.getByText('CREAR')).toBeInTheDocument();
    expect(screen.getByText('BAJA')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Inscripción a tenis')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
