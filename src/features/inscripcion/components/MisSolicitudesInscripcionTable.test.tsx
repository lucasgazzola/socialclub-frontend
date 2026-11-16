import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MisSolicitudesInscripcionTable } from './MisSolicitudesInscripcionTable';
import type { SolicitudInscripcion } from '../types';

const solicitudesMock: SolicitudInscripcion[] = [
  {
    id: 1,
    personaId: 10,
    disciplinaId: 1,
    categoriaDisciplinaId: 101,
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-11-13T10:30:00.000Z',
    fechaResolucion: null,
    motivoRechazo: null,
    disciplina: { id: 1, nombre: 'Básquet' },
    categoriaDisciplina: { id: 101, nombre: 'Primera Masculino' },
  },
  {
    id: 2,
    personaId: 10,
    disciplinaId: 2,
    categoriaDisciplinaId: null,
    estado: 'APROBADA',
    fechaSolicitud: '2026-11-12T09:15:00.000Z',
    fechaResolucion: '2026-11-12T14:00:00.000Z',
    motivoRechazo: null,
    disciplina: { id: 2, nombre: 'Natación' },
    categoriaDisciplina: null,
  },
  {
    id: 3,
    personaId: 10,
    disciplinaId: 3,
    categoriaDisciplinaId: 102,
    estado: 'RECHAZADA',
    fechaSolicitud: '2026-11-11T16:45:00.000Z',
    fechaResolucion: '2026-11-11T18:00:00.000Z',
    motivoRechazo: 'Cupo completo en el horario seleccionado.',
    disciplina: { id: 3, nombre: 'Tenis' },
    categoriaDisciplina: { id: 102, nombre: 'Avanzados' },
  },
  {
    id: 4,
    personaId: 10,
    disciplinaId: 4,
    categoriaDisciplinaId: null,
    estado: 'PENDIENTE_DOCUMENTACION',
    fechaSolicitud: '2026-11-10T11:00:00.000Z',
    fechaResolucion: null,
    motivoRechazo: null,
    disciplina: { id: 4, nombre: 'Fútbol' },
    categoriaDisciplina: null,
  },
  {
    id: 5,
    personaId: 10,
    disciplinaId: 5,
    categoriaDisciplinaId: null,
    estado: 'CANCELADA',
    fechaSolicitud: '2026-11-09T08:00:00.000Z',
    fechaResolucion: null,
    motivoRechazo: null,
    disciplina: { id: 5, nombre: 'Vóley' },
    categoriaDisciplina: null,
  },
];

describe('MisSolicitudesInscripcionTable (US-64)', () => {
  it('US-65: muestra cancelar para solicitudes cancelables y solicita confirmación', async () => {
    const user = userEvent.setup();
    const onCancelar = vi.fn().mockResolvedValue(undefined);

    render(
      <MisSolicitudesInscripcionTable
        solicitudes={solicitudesMock}
        onCancelar={onCancelar}
      />,
    );

    const botonesCancelar = screen.getAllByTestId('btn-cancelar-solicitud');
    expect(botonesCancelar).toHaveLength(3);
    await user.click(botonesCancelar[0]);

    expect(screen.getByTestId('modal-confirmar-cancelacion')).toBeInTheDocument();
    expect(onCancelar).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /sí, cancelar solicitud/i }));
    expect(onCancelar).toHaveBeenCalledWith(1);
  });

  it('TC-US64-UI-01: muestra la lista de solicitudes con disciplina, categoría, fecha y estado', () => {
    render(<MisSolicitudesInscripcionTable solicitudes={solicitudesMock} />);

    expect(screen.getByTestId('tabla-mis-solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Básquet')).toBeInTheDocument();
    expect(screen.getByText('Primera Masculino')).toBeInTheDocument();
    expect(screen.getByText('Natación')).toBeInTheDocument();
    // Categoría nula muestra "General"
    expect(screen.getAllByText('General').length).toBeGreaterThanOrEqual(1);

    // Badges de estado mapeados
    expect(screen.getByTestId('badge-estado-pendiente')).toHaveTextContent('En revisión');
    expect(screen.getByTestId('badge-estado-aprobada')).toHaveTextContent('Aprobada');
    expect(screen.getByTestId('badge-estado-rechazada')).toHaveTextContent('Rechazada');
    expect(screen.getByTestId('badge-estado-pendiente_documentacion')).toHaveTextContent(
      'Pendiente de documentación',
    );
    expect(screen.getByTestId('badge-estado-cancelada')).toHaveTextContent('Cancelada');
  });

  it('TC-US64-UI-02: muestra el motivo de rechazo de forma clara y accesible para solicitudes RECHAZADA', () => {
    render(<MisSolicitudesInscripcionTable solicitudes={solicitudesMock} />);

    const motivoBox = screen.getByTestId('motivo-rechazo-3');
    expect(motivoBox).toBeInTheDocument();
    expect(motivoBox).toHaveTextContent('Cupo completo en el horario seleccionado.');
  });

  it('TC-US64-UI-03: filtra las solicitudes por estado mediante el selector', async () => {
    const user = userEvent.setup();
    render(<MisSolicitudesInscripcionTable solicitudes={solicitudesMock} />);

    const filtro = screen.getByTestId('filtro-estado-solicitudes');
    expect(filtro).toBeInTheDocument();

    // Filtrar por RECHAZADA
    await user.selectOptions(filtro, 'RECHAZADA');

    expect(screen.getByText('Tenis')).toBeInTheDocument();
    expect(screen.queryByText('Básquet')).not.toBeInTheDocument();
    expect(screen.queryByText('Natación')).not.toBeInTheDocument();

    // Filtrar por PENDIENTE_DOCUMENTACION
    await user.selectOptions(filtro, 'PENDIENTE_DOCUMENTACION');
    expect(screen.getByText('Fútbol')).toBeInTheDocument();
    expect(screen.queryByText('Tenis')).not.toBeInTheDocument();

    // Volver a TODOS
    await user.selectOptions(filtro, 'TODOS');
    expect(screen.getByText('Básquet')).toBeInTheDocument();
    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('Tenis')).toBeInTheDocument();
  });

  it('TC-US64-UI-04: muestra mensaje informativo cuando no hay solicitudes en total', () => {
    render(<MisSolicitudesInscripcionTable solicitudes={[]} />);

    expect(screen.getByTestId('sin-solicitudes')).toBeInTheDocument();
    expect(screen.getByText(/Todavía no enviaste ninguna solicitud/i)).toBeInTheDocument();
  });

  it('TC-US64-UI-05: muestra mensaje informativo cuando el filtro no arroja resultados', async () => {
    const user = userEvent.setup();
    // Solo solicitudes aprobadas
    const soloAprobadas = [solicitudesMock[1]];
    render(<MisSolicitudesInscripcionTable solicitudes={soloAprobadas} />);

    const filtro = screen.getByTestId('filtro-estado-solicitudes');
    await user.selectOptions(filtro, 'RECHAZADA');

    expect(screen.getByTestId('sin-solicitudes-filtro')).toBeInTheDocument();
    expect(screen.getByText(/No hay solicitudes para el filtro seleccionado/i)).toBeInTheDocument();
  });
});
