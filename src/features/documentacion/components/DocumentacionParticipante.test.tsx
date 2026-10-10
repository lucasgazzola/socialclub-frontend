import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentacionParticipante } from './DocumentacionParticipante';
import { useCrearDocumentacion, useDocumentacionPorPersona, useEstadoDocumental } from '../hooks/useDocumentacion';
import type { EstadoDocumentalPersona } from '../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../hooks/useDocumentacion', () => ({
  useCrearDocumentacion: vi.fn(),
  useDocumentacionPorPersona: vi.fn(),
  useEstadoDocumental: vi.fn(),
}));

const crearMock = vi.fn();
const persona = { id: 10, nombre: 'Juan', apellido: 'Pérez' };

const estado: EstadoDocumentalPersona = {
  personaId: 10,
  estado: 'PENDIENTE',
  inscripciones: [
    {
      inscripcionId: 5,
      disciplina: { id: 1, nombre: 'Fútbol' },
      categoriaDisciplina: { id: 7, nombre: 'Sub-15' },
      estado: 'PENDIENTE',
      motivos: ['Autorización de padres/tutores: falta presentarlo hasta el 15/10/2026'],
      habilitadoExcepcionalmenteHasta: null,
      documentos: [
        {
          tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
          etiqueta: 'Certificado médico de aptitud física',
          origen: 'DISCIPLINA',
          plazoDiasTolerancia: 30,
          estado: 'VIGENTE',
          documentoId: 3,
          fechaVencimiento: '2027-03-31T00:00:00.000Z',
          fechaLimite: null,
        },
        {
          tipoDocumento: 'AUTORIZACION_PADRES_TUTORES',
          etiqueta: 'Autorización de padres/tutores',
          origen: 'CATEGORIA',
          plazoDiasTolerancia: 15,
          estado: 'FALTANTE',
          documentoId: null,
          fechaVencimiento: null,
          fechaLimite: '2026-10-15T03:00:00.000Z',
        },
      ],
    },
  ],
  tiposExigidos: [
    { tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', etiqueta: 'Autorización de padres/tutores', documentoActualId: null },
    { tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', etiqueta: 'Certificado médico de aptitud física', documentoActualId: 3 },
  ],
};

/** Fecha de dentro de un año en dd/mm/aaaa y en ISO. */
function fechaFutura() {
  const d = new Date();
  const anio = d.getFullYear() + 1;
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return { texto: `15/${mes}/${anio}`, iso: `${anio}-${mes}-15` };
}

const mockHook = (hook: unknown) => hook as ReturnType<typeof vi.fn>;

describe('US-24/25 · TASK-31 · DocumentacionParticipante', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearMock.mockResolvedValue({ id: 1, personaId: 10 });
    mockHook(useCrearDocumentacion).mockReturnValue({ mutateAsync: crearMock });
    mockHook(useEstadoDocumental).mockReturnValue({ data: estado, isLoading: false });
    mockHook(useDocumentacionPorPersona).mockReturnValue({
      data: [{ id: 3, tipo: 'Certificado médico de aptitud física', tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA', fechaVencimiento: '2027-03-31T00:00:00.000Z', archivoNombre: null }],
    });
  });

  it('muestra, por inscripción, lo exigido y su estado', () => {
    render(<DocumentacionParticipante persona={persona} />);

    const futbol = screen.getByRole('region', { name: 'Documentación para Fútbol' });
    expect(within(futbol).getByText('Pendiente de documentación')).toBeInTheDocument();
    expect(within(futbol).getByText('Vence el 31/03/2027')).toBeInTheDocument();
    expect(within(futbol).getByText('Vigente')).toBeInTheDocument();
    expect(within(futbol).getByText('Presentar hasta el 15/10/2026')).toBeInTheDocument();
    expect(within(futbol).getByText('Faltante')).toBeInTheDocument();
    expect(within(futbol).getByText('(de la categoría)')).toBeInTheDocument();
  });

  it('no muestra la sección de carga hasta que se presiona el botón Cargar', () => {
    render(<DocumentacionParticipante persona={persona} />);

    expect(screen.queryByRole('heading', { name: 'Cargar documentación' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fecha de vencimiento/)).not.toBeInTheDocument();
  });

  it('"Cargar" en un faltante muestra "Cargar documentación" con el tipo fijo y carga el documento', async () => {
    const user = userEvent.setup();
    const { texto, iso } = fechaFutura();
    render(<DocumentacionParticipante persona={persona} />);

    await user.click(screen.getByRole('button', { name: 'Cargar' }));
    const seccionCarga = screen.getByRole('heading', { name: 'Cargar documentación' }).closest('section')!;
    expect(within(seccionCarga).getByText('Autorización de padres/tutores')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de documento')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Fecha de vencimiento/), texto);
    const file = new File(['contenido'], 'autorizacion.pdf', { type: 'application/pdf' });
    const inputArchivo = screen.getByLabelText(/Archivo \(PDF o imagen\)/);
    await user.upload(inputArchivo, file);
    await user.click(screen.getByRole('button', { name: 'Cargar documentación' }));

    await waitFor(() => {
      expect(crearMock).toHaveBeenCalledWith({
        payload: { tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', fechaVencimiento: iso, personaId: 10 },
        archivo: file,
      });
    });
  });

  it('no envía sin fecha de vencimiento ni sin archivo, y permite cancelar', async () => {
    const user = userEvent.setup();
    const { texto } = fechaFutura();
    render(<DocumentacionParticipante persona={persona} />);

    await user.click(screen.getByRole('button', { name: 'Cargar' }));
    expect(screen.getByRole('heading', { name: 'Cargar documentación' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cargar documentación' }));
    expect(await screen.findByText('La fecha de vencimiento es obligatoria')).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();

    // Completar fecha pero sin archivo
    await user.type(screen.getByLabelText(/Fecha de vencimiento/), texto);
    await user.click(screen.getByRole('button', { name: 'Cargar documentación' }));
    expect(await screen.findByText('El archivo es obligatorio')).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    expect(screen.queryByRole('heading', { name: 'Cargar documentación' })).not.toBeInTheDocument();
  });

  it('sin permiso de carga solo muestra el estado', () => {
    render(<DocumentacionParticipante persona={persona} puedeCargar={false} />);

    expect(screen.queryByRole('heading', { name: 'Cargar documentación' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar' })).not.toBeInTheDocument();
  });

  it('avisa si las disciplinas del participante no exigen documentación', () => {
    mockHook(useEstadoDocumental).mockReturnValue({
      data: { ...estado, estado: 'HABILITADO', tiposExigidos: [], inscripciones: [{ ...estado.inscripciones[0], estado: 'HABILITADO', motivos: [], documentos: [] }] },
      isLoading: false,
    });
    render(<DocumentacionParticipante persona={persona} />);

    expect(screen.getByText('No exige documentación.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cargar documentación' })).not.toBeInTheDocument();
  });

  it('US-25 · TC-181: muestra badge "Por vencer" cuando el documento vence en los próximos 30 días', () => {
    mockHook(useEstadoDocumental).mockReturnValue({
      data: {
        ...estado,
        estado: 'HABILITADO',
        inscripciones: [
          {
            ...estado.inscripciones[0],
            estado: 'HABILITADO',
            documentos: [
              {
                tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
                etiqueta: 'Certificado médico de aptitud física',
                origen: 'DISCIPLINA',
                plazoDiasTolerancia: 30,
                estado: 'POR_VENCER',
                documentoId: 3,
                fechaVencimiento: '2026-10-20T00:00:00.000Z',
                fechaLimite: null,
              },
            ],
          },
        ],
      },
      isLoading: false,
    });
    render(<DocumentacionParticipante persona={persona} />);

    expect(screen.getByText('Por vencer')).toBeInTheDocument();
    expect(screen.getByText('Habilitado')).toBeInTheDocument();
    expect(screen.getByText(/Vence el 20\/10\/2026/)).toBeInTheDocument();
  });

  it('US-25 · TC-183: muestra badge "Bloqueado" y documento "Vencido" ante vencimiento', () => {
    mockHook(useEstadoDocumental).mockReturnValue({
      data: {
        ...estado,
        estado: 'BLOQUEADO',
        inscripciones: [
          {
            ...estado.inscripciones[0],
            estado: 'BLOQUEADO',
            motivos: ['Certificado médico de aptitud física: vencido el 30/09/2026'],
            documentos: [
              {
                tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
                etiqueta: 'Certificado médico de aptitud física',
                origen: 'DISCIPLINA',
                plazoDiasTolerancia: 30,
                estado: 'VENCIDO',
                documentoId: 3,
                fechaVencimiento: '2026-09-30T00:00:00.000Z',
                fechaLimite: null,
              },
            ],
          },
        ],
      },
      isLoading: false,
    });
    render(<DocumentacionParticipante persona={persona} />);

    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText(/Vence el 30\/09\/2026/)).toBeInTheDocument();
  });

  describe('US-27 · Bloqueo de participante ante documentación vencida', () => {
    it('US-27 · TC-188: muestra banner de bloqueo con los motivos detallados del documento vencido o faltante', () => {
      mockHook(useEstadoDocumental).mockReturnValue({
        data: {
          ...estado,
          estado: 'BLOQUEADO',
          inscripciones: [
            {
              ...estado.inscripciones[0],
              estado: 'BLOQUEADO',
              motivos: [
                'Certificado médico de aptitud física: vencido el 30/09/2026',
                'Autorización de padres/tutores: no se presentó (el plazo venció el 15/09/2026)',
              ],
            },
          ],
        },
        isLoading: false,
      });

      render(<DocumentacionParticipante persona={persona} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(within(alert).getByText('Inscripción bloqueada por documentación:')).toBeInTheDocument();
      expect(within(alert).getByText('Certificado médico de aptitud física: vencido el 30/09/2026')).toBeInTheDocument();
      expect(within(alert).getByText('Autorización de padres/tutores: no se presentó (el plazo venció el 15/09/2026)')).toBeInTheDocument();
    });

    it('US-27 · TC-189: no muestra banner de bloqueo cuando la inscripción está habilitada tras presentar documentación vigente', () => {
      mockHook(useEstadoDocumental).mockReturnValue({
        data: {
          ...estado,
          estado: 'HABILITADO',
          inscripciones: [
            {
              ...estado.inscripciones[0],
              estado: 'HABILITADO',
              motivos: [],
            },
          ],
        },
        isLoading: false,
      });

      render(<DocumentacionParticipante persona={persona} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Habilitado')).toBeInTheDocument();
    });
  });
});

