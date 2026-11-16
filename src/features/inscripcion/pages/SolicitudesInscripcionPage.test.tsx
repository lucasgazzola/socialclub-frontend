import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { SolicitudesInscripcionPage } from './SolicitudesInscripcionPage';
import * as inscripcionApi from '../api/inscripcion.api';
import type { SolicitudInscripcionAdmin } from '../types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [
      { id: 1, nombre: 'Fútbol', activo: true, categorias: [] },
      { id: 2, nombre: 'Natación', activo: true, categorias: [] },
    ],
    cargando: false,
    error: null,
  }),
}));

vi.mock('../api/inscripcion.api', () => ({
  listarSolicitudesInscripcion: vi.fn(),
  aprobarSolicitudInscripcion: vi.fn(),
  rechazarSolicitudInscripcion: vi.fn(),
}));

const solicitudesMock: SolicitudInscripcionAdmin[] = [
  {
    id: 10,
    personaId: 100,
    disciplinaId: 2,
    categoriaDisciplinaId: 5,
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-11-10T10:00:00.000Z',
    fechaResolucion: null,
    motivoRechazo: null,
    persona: {
      id: 100,
      nombre: 'Valentina',
      apellido: 'Luna',
      dni: '42110873',
      email: 'valentina.luna@club.local',
      telefono: '3534-421714',
      activo: true,
    },
    disciplina: {
      id: 2,
      nombre: 'Natación',
      solicitaDocumentacion: true,
    },
    categoriaDisciplina: {
      id: 5,
      nombre: 'Adultos',
    },
    documentacion: {
      estado: 'HABILITADO',
      completa: true,
      requiereDocumentacion: true,
      documentos: [
        {
          tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
          etiqueta: 'Certificado médico de aptitud física',
          origen: 'DISCIPLINA',
          plazoDiasTolerancia: 15,
          estado: 'VIGENTE',
          documentoId: 50,
          fechaVencimiento: '2027-03-01T00:00:00.000Z',
          fechaLimite: null,
        },
      ],
      faltantes: [],
      motivos: [],
    },
  },
  {
    id: 11,
    personaId: 101,
    disciplinaId: 1,
    categoriaDisciplinaId: 7,
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-11-11T12:00:00.000Z',
    fechaResolucion: null,
    motivoRechazo: null,
    persona: {
      id: 101,
      nombre: 'Emma',
      apellido: 'Roldán',
      dni: '54017662',
      email: null,
      telefono: '3534-422515',
      activo: true,
    },
    disciplina: {
      id: 1,
      nombre: 'Fútbol',
      solicitaDocumentacion: true,
    },
    categoriaDisciplina: {
      id: 7,
      nombre: 'Escuelita',
    },
    documentacion: {
      estado: 'PENDIENTE',
      completa: false,
      requiereDocumentacion: true,
      documentos: [
        {
          tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
          etiqueta: 'Certificado médico de aptitud física',
          origen: 'DISCIPLINA',
          plazoDiasTolerancia: 15,
          estado: 'FALTANTE',
          documentoId: null,
          fechaVencimiento: null,
          fechaLimite: '2026-11-30T00:00:00.000Z',
        },
      ],
      faltantes: ['Certificado médico de aptitud física'],
      motivos: ['Certificado médico de aptitud física: falta presentarlo hasta el 30/11/2026'],
    },
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/inscripcion/solicitudes']}>
        <SolicitudesInscripcionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('US-66 — SolicitudesInscripcionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inscripcionApi.listarSolicitudesInscripcion).mockResolvedValue(solicitudesMock);
  });

  it('CA 1 y CA 2: muestra el listado en estado Pendiente y el estado de la documentación obligatoria (completa vs faltantes)', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('solicitud-inscripcion-10')).toBeInTheDocument();
    });

    expect(inscripcionApi.listarSolicitudesInscripcion).toHaveBeenCalledWith({
      estado: 'PENDIENTE',
      disciplinaId: undefined,
      busqueda: undefined,
    });

    expect(screen.getByText('Luna, Valentina')).toBeInTheDocument();
    expect(screen.getByText('Documentación completa')).toBeInTheDocument();
    expect(screen.getByText(/Certificado médico de aptitud física \(Vigente\)/i)).toBeInTheDocument();

    expect(screen.getByText('Roldán, Emma')).toBeInTheDocument();
    expect(screen.getByText('Documentos faltantes')).toBeInTheDocument();
    expect(screen.getByText(/Certificado médico de aptitud física: Faltante/i)).toBeInTheDocument();
  });

  it('CA 1: permite filtrar por disciplina y buscar por nombre, apellido o DNI del socio', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('tabla-solicitudes-admin')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por disciplina'), '2');

    await waitFor(() => {
      expect(inscripcionApi.listarSolicitudesInscripcion).toHaveBeenLastCalledWith({
        estado: 'PENDIENTE',
        disciplinaId: 2,
        busqueda: undefined,
      });
    });

    await user.type(
      screen.getByPlaceholderText('Buscar por nombre, apellido o DNI...'),
      '42110873',
    );

    await waitFor(() => {
      expect(inscripcionApi.listarSolicitudesInscripcion).toHaveBeenLastCalledWith({
        estado: 'PENDIENTE',
        disciplinaId: 2,
        busqueda: '42110873',
      });
    });
  });

  it('CA 3: al aprobar una solicitud, confirma la creación de la inscripción y la cuota deportiva generada', async () => {
    const user = userEvent.setup();
    vi.mocked(inscripcionApi.aprobarSolicitudInscripcion).mockResolvedValue({
      solicitud: {
        ...solicitudesMock[0],
        estado: 'APROBADA',
      },
      inscripcion: {
        id: 500,
        personaId: 100,
        disciplinaId: 2,
        categoriaDisciplinaId: 5,
        fechaInscripcion: '2026-11-16T00:00:00.000Z',
        activo: true,
        persona: {
          id: 100,
          nombre: 'Valentina',
          apellido: 'Luna',
          dni: '42110873',
          fechaNacimiento: null,
          email: 'valentina.luna@club.local',
          telefono: '3534-421714',
          activo: true,
        },
        disciplina: { id: 2, nombre: 'Natación' },
        categoriaDisciplina: { id: 5, nombre: 'Adultos' },
      },
      estadoDocumental: {
        estado: 'HABILITADO',
        motivos: [],
        documentos: [],
        habilitadoExcepcionalmenteHasta: null,
      },
      cuotaGenerada: {
        periodo: '2026-11',
        monto: 8000,
        montoTarifa: 10000,
        descuentoSocioPorcentaje: 20,
        esSocio: true,
        sinTarifa: false,
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('btn-aprobar-10')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('btn-aprobar-10'));
    expect(screen.getByText('Aprobar solicitud de inscripción')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' }));

    await waitFor(() => {
      expect(inscripcionApi.aprobarSolicitudInscripcion).toHaveBeenCalledWith(10);
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Inscripción creada en estado «Habilitada»'),
    );
  });

  it('CA 4: al rechazar una solicitud, exige un motivo obligatorio y cambia el estado a Rechazada', async () => {
    const user = userEvent.setup();
    vi.mocked(inscripcionApi.rechazarSolicitudInscripcion).mockResolvedValue({
      ...solicitudesMock[1],
      estado: 'RECHAZADA',
      motivoRechazo: 'Cupo completo en la categoría Escuelita.',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('btn-rechazar-11')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('btn-rechazar-11'));
    expect(screen.getByText('Rechazar solicitud de inscripción')).toBeInTheDocument();

    // Intentar rechazar sin motivo -> muestra validación obligatoria
    await user.click(screen.getByTestId('btn-confirmar-rechazo'));
    expect(screen.getByText('El motivo de rechazo es obligatorio.')).toBeInTheDocument();
    expect(inscripcionApi.rechazarSolicitudInscripcion).not.toHaveBeenCalled();

    // Ingresar motivo y confirmar
    await user.type(
      screen.getByLabelText(/Motivo del rechazo/i),
      'Cupo completo en la categoría Escuelita.',
    );
    await user.click(screen.getByTestId('btn-confirmar-rechazo'));

    await waitFor(() => {
      expect(inscripcionApi.rechazarSolicitudInscripcion).toHaveBeenCalledWith(
        11,
        'Cupo completo en la categoría Escuelita.',
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Solicitud de inscripción rechazada.');
  });
});
