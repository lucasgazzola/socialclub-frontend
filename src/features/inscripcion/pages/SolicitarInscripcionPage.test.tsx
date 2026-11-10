import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { SolicitarInscripcionPage } from './SolicitarInscripcionPage';
import type { DisciplinaCatalogo, SolicitudInscripcion } from '../types';

const api = vi.hoisted(() => ({
  obtenerCatalogoInscripcion: vi.fn(),
  solicitarInscripcion: vi.fn(),
  obtenerMisSolicitudesInscripcion: vi.fn(),
}));

vi.mock('../api/inscripcion.api', () => ({
  obtenerCatalogoInscripcion: api.obtenerCatalogoInscripcion,
  solicitarInscripcion: api.solicitarInscripcion,
  obtenerMisSolicitudesInscripcion: api.obtenerMisSolicitudesInscripcion,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const disciplinaCatalogoMock: DisciplinaCatalogo = {
  id: 1,
  nombre: 'Básquet',
  descripcion: 'Básquet formativo y competitivo',
  genero: null,
  edadMinima: null,
  edadMaxima: null,
  solicitaDocumentacion: true,
  arancelMensual: 12000,
  descuentoSocioPorcentaje: 20,
  documentosObligatorios: [
    { tipoDocumento: 'DNI', nombre: 'DNI', plazoDiasTolerancia: 0 },
  ],
  categorias: [
    {
      id: 10,
      nombre: 'Primera Masculino',
      genero: 'MASCULINO',
      edadMinima: 18,
      edadMaxima: 40,
      arancelMensual: 12000,
      documentosObligatorios: [
        { tipoDocumento: 'DNI', nombre: 'DNI', plazoDiasTolerancia: 0 },
        {
          tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
          nombre: 'Certificado médico de aptitud física',
          plazoDiasTolerancia: 15,
        },
      ],
      cumpleRestricciones: true,
      motivosIncumplimiento: [],
    },
    {
      id: 11,
      nombre: 'Sub-15 Masculino',
      genero: 'MASCULINO',
      edadMinima: 12,
      edadMaxima: 15,
      arancelMensual: 10000,
      documentosObligatorios: [
        { tipoDocumento: 'DNI', nombre: 'DNI', plazoDiasTolerancia: 0 },
      ],
      cumpleRestricciones: false,
      motivosIncumplimiento: ['Edad fuera del rango (12 a 15 años): cumple 26 en 2026.'],
    },
  ],
  cumpleRestricciones: true,
  motivosIncumplimiento: [],
  inscripto: false,
  solicitudPendiente: false,
};

const solicitudMock: SolicitudInscripcion = {
  id: 50,
  personaId: 2,
  disciplinaId: 1,
  categoriaDisciplinaId: 10,
  estado: 'PENDIENTE',
  fechaSolicitud: '2026-11-04T10:00:00Z',
  fechaResolucion: null,
  motivoRechazo: null,
  disciplina: { id: 1, nombre: 'Básquet', descripcion: 'Básquet competitivo' },
  categoriaDisciplina: { id: 10, nombre: 'Primera Masculino' },
};

describe('US-63 — Solicitar inscripción a una disciplina', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.obtenerCatalogoInscripcion.mockResolvedValue({
      esSocio: true,
      items: [disciplinaCatalogoMock],
    });
    api.obtenerMisSolicitudesInscripcion.mockResolvedValue([solicitudMock]);
  });

  it('TC-291: muestra el catálogo de disciplinas activas con arancel y documentos obligatorios', async () => {
    renderWithProviders(<SolicitarInscripcionPage />);

    expect(await screen.findByText('Básquet')).toBeInTheDocument();
    expect(screen.getByText('Básquet formativo y competitivo')).toBeInTheDocument();
    expect(screen.getByText('$12.000')).toBeInTheDocument();
    expect(screen.getByText('Incluye 20% desc. por ser socio')).toBeInTheDocument();
    expect(screen.getByText(/1 documentos obligatorios/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-postularse-1')).toBeInTheDocument();
  });

  it('TC-293: socio completa el formulario de postulación y recibe feedback claro en pantalla (toast vía sonner)', async () => {
    const user = userEvent.setup();
    api.solicitarInscripcion.mockResolvedValue({
      id: 51,
      disciplinaId: 1,
      categoriaDisciplinaId: 10,
      estado: 'PENDIENTE',
    });

    renderWithProviders(<SolicitarInscripcionPage />);

    const btnPostularse = await screen.findByTestId('btn-postularse-1');
    await user.click(btnPostularse);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Solicitar inscripción a Básquet/i)).toBeInTheDocument();

    const selectCategoria = screen.getByTestId('select-categoria-solicitud');
    await user.selectOptions(selectCategoria, '10');

    expect(
      screen.getByText(/Cumplís con los parámetros de edad y género configurados/i),
    ).toBeInTheDocument();

    const btnConfirmar = screen.getByTestId('btn-confirmar-solicitud');
    await user.click(btnConfirmar);

    await waitFor(() => {
      expect(api.solicitarInscripcion).toHaveBeenCalledWith({
        disciplinaId: 1,
        categoriaDisciplinaId: 10,
      });
      expect(toast.success).toHaveBeenCalledWith(
        'Solicitud de inscripción registrada con éxito. Estado: Pendiente.',
      );
    });
  });

  it('TC-289: bloquea la confirmación si la categoría no cumple con las restricciones de edad o género', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SolicitarInscripcionPage />);

    const btnPostularse = await screen.findByTestId('btn-postularse-1');
    await user.click(btnPostularse);

    const selectCategoria = await screen.findByTestId('select-categoria-solicitud');
    // Seleccionar Sub-15 que tiene restricciones no cumplidas
    await user.selectOptions(selectCategoria, '11');

    expect(
      await screen.findByText(/No cumplís con las restricciones para postularte:/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Edad fuera del rango \(12 a 15 años\): cumple 26 en 2026\./i),
    ).toBeInTheDocument();

    const btnConfirmar = screen.getByTestId('btn-confirmar-solicitud');
    expect(btnConfirmar).toBeDisabled();
  });

  it('TC-292: valida duplicidad mostrando estado y deshabilitando postulación si ya está inscripto o tiene solicitud pendiente', async () => {
    api.obtenerCatalogoInscripcion.mockResolvedValue({
      esSocio: true,
      items: [
        {
          ...disciplinaCatalogoMock,
          id: 2,
          nombre: 'Natación',
          inscripto: true,
        },
        {
          ...disciplinaCatalogoMock,
          id: 3,
          nombre: 'Tenis',
          solicitudPendiente: true,
        },
      ],
    });

    renderWithProviders(<SolicitarInscripcionPage />);

    expect(await screen.findByText('Natación')).toBeInTheDocument();
    expect(screen.getByTestId('badge-inscripto-2')).toHaveTextContent('Inscripto');
    expect(screen.getByTestId('btn-postularse-2')).toBeDisabled();
    expect(screen.getByTestId('btn-postularse-2')).toHaveTextContent('Ya estás inscripto');

    expect(screen.getByText('Tenis')).toBeInTheDocument();
    expect(screen.getByTestId('badge-solicitud-pendiente-3')).toHaveTextContent('Solicitud pendiente');
    expect(screen.getByTestId('btn-postularse-3')).toBeDisabled();
    expect(screen.getByTestId('btn-postularse-3')).toHaveTextContent('Solicitud pendiente');
  });

  it('permite alternar a la pestaña de Mis solicitudes y ver el historial con su estado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SolicitarInscripcionPage />);

    const tabSolicitudes = await screen.findByRole('tab', { name: /Mis solicitudes/i });
    await user.click(tabSolicitudes);

    expect(await screen.findByTestId('tabla-mis-solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Básquet')).toBeInTheDocument();
    expect(screen.getByText('Primera Masculino')).toBeInTheDocument();
    expect(screen.getByTestId('badge-estado-pendiente')).toHaveTextContent('Pendiente');
  });
});

