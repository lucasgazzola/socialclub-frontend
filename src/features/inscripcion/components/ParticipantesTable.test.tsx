import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ParticipantesTable } from './ParticipantesTable';
import type { DisciplinaInscripta, ParticipanteConDisciplinas } from '../types';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

/** Inscripción (disciplina) de prueba. */
function disciplina(overrides: Partial<DisciplinaInscripta> = {}): DisciplinaInscripta {
  return {
    inscripcionId: 1,
    disciplinaId: 1,
    disciplina: { id: 1, nombre: 'Fútbol' },
    categoriaDisciplinaId: 2,
    categoriaDisciplina: { id: 2, nombre: 'Sub-15' },
    fechaInscripcion: '2026-01-10T00:00:00.000Z',
    activo: true,
    estado: 'INSCRIPTO',
    ...overrides,
  };
}

/** Participante (fila agrupada) de prueba. */
function participante(
  overrides: Partial<ParticipanteConDisciplinas> = {},
): ParticipanteConDisciplinas {
  return {
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
    disciplinas: [disciplina()],
    cantidadDisciplinas: 1,
    estado: 'INSCRIPTO',
    ...overrides,
  };
}

describe('US-08 · ParticipantesTable', () => {
  it('muestra los datos básicos del participante (nombre, DNI, disciplinas y estado)', () => {
    render(
      <ParticipantesTable
        participantes={[
          participante({
            disciplinas: [
              disciplina(),
              disciplina({
                inscripcionId: 2,
                disciplinaId: 2,
                disciplina: { id: 2, nombre: 'Vóley' },
              }),
            ],
            cantidadDisciplinas: 2,
          }),
        ]}
      />,
    );

    expect(screen.getByText('Perez, Juan')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Fútbol, Vóley')).toBeInTheDocument();
    expect(screen.getByText('Inscripto')).toBeInTheDocument();
  });

  it('muestra solo una fila para un participante con varias disciplinas', () => {
    const { container } = render(
      <ParticipantesTable
        participantes={[
          participante({
            disciplinas: [
              disciplina(),
              disciplina({
                inscripcionId: 2,
                disciplinaId: 2,
                disciplina: { id: 2, nombre: 'Vóley' },
              }),
            ],
            cantidadDisciplinas: 2,
          }),
        ]}
      />,
    );

    const filas = container.querySelectorAll('tbody > tr');
    expect(filas).toHaveLength(1);
  });

  it('al expandir la fila se ven todas las disciplinas con su categoría y estado', async () => {
    const user = userEvent.setup();
    render(
      <ParticipantesTable
        participantes={[
          participante({
            disciplinas: [
              disciplina(),
              disciplina({
                inscripcionId: 2,
                disciplinaId: 2,
                disciplina: { id: 2, nombre: 'Vóley' },
                categoriaDisciplinaId: null,
                categoriaDisciplina: null,
                activo: false,
                estado: 'BAJA',
              }),
            ],
            cantidadDisciplinas: 2,
          }),
        ]}
      />,
    );

    expect(screen.queryByText('Sub-15')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver disciplinas de Perez, Juan/i }));

    expect(screen.getByText('Vóley')).toBeInTheDocument();
    expect(screen.getByText('Sub-15')).toBeInTheDocument();
    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('colapsa el detalle al volver a pulsar el botón', async () => {
    const user = userEvent.setup();
    render(<ParticipantesTable participantes={[participante()]} />);

    // El aria-label es estable, así que el botón se consulta siempre por él.
    const boton = screen.getByRole('button', { name: /Ver disciplinas de/i });
    await user.click(boton);
    expect(screen.getByText('Sub-15')).toBeInTheDocument();
    expect(screen.getByText('Ocultar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ver disciplinas de/i }));
    expect(screen.queryByText('Sub-15')).not.toBeInTheDocument();
  });

  it('muestra el estado agregado Baja cuando el participante no tiene inscripciones activas', () => {
    render(
      <ParticipantesTable
        participantes={[
          participante({
            estado: 'BAJA',
            disciplinas: [disciplina({ activo: false, estado: 'BAJA' })],
          }),
        ]}
      />,
    );

    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('muestra el mensaje No se encontraron resultados cuando no hay coincidencias', () => {
    render(<ParticipantesTable participantes={[]} />);

    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });
});
