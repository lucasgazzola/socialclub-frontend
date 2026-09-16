import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ParticipantesTable } from './ParticipantesTable';
import type { DisciplinaInscripta, ParticipanteConDisciplinas } from '../types';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const auth = { roles: ['DELEGADO'] as string[] };

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ usuario: { id: 99, email: 'delegado@test.com', roles: auth.roles } }),
}));

const baja = { mutateAsync: vi.fn(), isPending: false };
const reactivacion = { mutateAsync: vi.fn(), isPending: false };

vi.mock('../hooks/useDarDeBajaParticipante', () => ({
  useDarDeBajaParticipante: () => ({
    mutateAsync: baja.mutateAsync,
    isPending: baja.isPending,
  }),
}));

vi.mock('../hooks/useActivarParticipante', () => ({
  useActivarParticipante: () => ({
    mutateAsync: reactivacion.mutateAsync,
    isPending: reactivacion.isPending,
  }),
}));

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
      activo: true,
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
    expect(screen.getByText('Activo')).toBeInTheDocument();
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

  it('muestra el estado Inactivo del participante dado de baja (US-07)', () => {
    render(
      <ParticipantesTable
        participantes={[
          participante({
            persona: { ...participante().persona, activo: false },
            estado: 'BAJA',
            disciplinas: [disciplina({ activo: false, estado: 'BAJA' })],
          }),
        ]}
      />,
    );

    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('muestra el mensaje No se encontraron resultados cuando no hay coincidencias', () => {
    render(<ParticipantesTable participantes={[]} />);

    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });

  describe('US-07 · Dar de baja al participante', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      auth.roles = ['DELEGADO'];
      baja.isPending = false;
      baja.mutateAsync.mockResolvedValue({ personaId: 10, activo: false, disciplinasDadasDeBaja: 1 });
    });

    it('TC-0707: ofrece Dar de baja al delegado y confirma con un mensaje claro', async () => {
      const user = userEvent.setup();
      render(<ParticipantesTable participantes={[participante()]} />);

      expect(screen.getByText('Activo')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Dar de baja a Perez, Juan/i }));

      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveTextContent('Dar de baja al participante');
      expect(dialogo).toHaveTextContent(/no va a poder participar de ninguna disciplina/i);
      expect(dialogo).toHaveTextContent(/no se le van a generar nuevas cuotas/i);

      await user.click(screen.getByRole('button', { name: 'Dar de baja' }));

      await waitFor(() => {
        expect(baja.mutateAsync).toHaveBeenCalledWith(10);
      });
    });

    it('TC-0708: no da de baja si el delegado cancela el diálogo', async () => {
      const user = userEvent.setup();
      render(<ParticipantesTable participantes={[participante()]} />);

      await user.click(screen.getByRole('button', { name: /Dar de baja a Perez, Juan/i }));
      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

      expect(baja.mutateAsync).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('no ofrece la baja a un participante ya dado de baja y muestra su estado Inactivo', () => {
      render(
        <ParticipantesTable
          participantes={[
            participante({
              persona: {
                id: 10,
                nombre: 'Juan',
                apellido: 'Perez',
                dni: '12345678',
                fechaNacimiento: null,
                email: 'juan@test.com',
                telefono: '1111111111',
                activo: false,
              },
              estado: 'BAJA',
              disciplinas: [disciplina({ activo: false, estado: 'BAJA' })],
            }),
          ]}
        />,
      );

      expect(screen.getByText('Inactivo')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Dar de baja a/i })).not.toBeInTheDocument();
    });

    it('oculta la baja a un rol que no puede hacerla (SOCIO)', () => {
      auth.roles = ['SOCIO'];
      render(<ParticipantesTable participantes={[participante()]} />);

      expect(screen.queryByRole('button', { name: /Dar de baja a/i })).not.toBeInTheDocument();
    });
  });

  describe('US-07 · Reactivar participante', () => {
    function participanteInactivo() {
      return participante({
        persona: {
          id: 10,
          nombre: 'Juan',
          apellido: 'Perez',
          dni: '12345678',
          fechaNacimiento: null,
          email: 'juan@test.com',
          telefono: '1111111111',
          activo: false,
        },
        estado: 'BAJA',
        disciplinas: [disciplina({ activo: false, estado: 'BAJA' })],
      });
    }

    beforeEach(() => {
      vi.clearAllMocks();
      auth.roles = ['DELEGADO'];
      reactivacion.isPending = false;
      reactivacion.mutateAsync.mockResolvedValue({ personaId: 10, activo: true });
    });

    it('TC-0711: ofrece Reactivar a un participante dado de baja y lo confirma', async () => {
      const user = userEvent.setup();
      render(<ParticipantesTable participantes={[participanteInactivo()]} />);

      await user.click(screen.getByRole('button', { name: /Reactivar a Perez, Juan/i }));

      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveTextContent('Reactivar al participante');
      expect(dialogo).toHaveTextContent(/va a poder inscribirse de nuevo/i);

      await user.click(screen.getByRole('button', { name: 'Reactivar' }));

      await waitFor(() => {
        expect(reactivacion.mutateAsync).toHaveBeenCalledWith(10);
      });
    });

    it('TC-0712: no reactiva si el delegado cancela el diálogo', async () => {
      const user = userEvent.setup();
      render(<ParticipantesTable participantes={[participanteInactivo()]} />);

      await user.click(screen.getByRole('button', { name: /Reactivar a Perez, Juan/i }));
      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

      expect(reactivacion.mutateAsync).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('no ofrece Reactivar a un participante activo', () => {
      render(<ParticipantesTable participantes={[participante()]} />);

      expect(screen.queryByRole('button', { name: /Reactivar a/i })).not.toBeInTheDocument();
    });
  });
});
