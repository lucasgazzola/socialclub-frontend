import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParticipantesTable } from './ParticipantesTable';
import type { Inscripcion } from '../types';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

/** Participante (fila) de prueba con datos básicos completos. */
function participante(overrides: Partial<Inscripcion> = {}): Inscripcion {
  return {
    id: 1,
    personaId: 10,
    persona: {
      id: 10,
      nombre: 'Juan',
      apellido: 'Perez',
      dni: '12345678',
      fechaNacimiento: null,
      email: 'juan@test.com',
      telefono: '1111111111',
    },
    disciplinaId: 1,
    disciplina: { id: 1, nombre: 'Fútbol' },
    categoriaDisciplinaId: 2,
    categoriaDisciplina: { id: 2, nombre: 'Sub-15' },
    fechaInscripcion: '2026-01-10T00:00:00.000Z',
    activo: true,
    ...overrides,
  };
}

describe('US-08 · ParticipantesTable', () => {
  it('muestra los datos básicos de cada participante (nombre, DNI, disciplina y estado)', () => {
    render(
      <ParticipantesTable
        participantes={[
          participante(),
          participante({
            id: 2,
            personaId: 11,
            persona: {
              ...participante().persona,
              id: 11,
              apellido: 'Gomez',
              nombre: 'Ana',
              dni: '87654321',
            },
            disciplinaId: 2,
            disciplina: { id: 2, nombre: 'Vóley' },
            activo: false,
            estado: 'BAJA',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Perez, Juan')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Fútbol')).toBeInTheDocument();
    expect(screen.getByText('Inscripto')).toBeInTheDocument();

    expect(screen.getByText('Gomez, Ana')).toBeInTheDocument();
    expect(screen.getByText('87654321')).toBeInTheDocument();
    expect(screen.getByText('Vóley')).toBeInTheDocument();
    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('muestra el mensaje No se encontraron resultados cuando no hay coincidencias', () => {
    render(<ParticipantesTable participantes={[]} />);

    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });
});
