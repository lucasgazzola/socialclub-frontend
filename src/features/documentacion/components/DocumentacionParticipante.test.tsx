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

  it('solo ofrece los tipos de documento exigidos al participante', () => {
    render(<DocumentacionParticipante persona={persona} />);

    const opciones = within(screen.getByLabelText('Tipo de documento')).getAllByRole('option').map((o) => o.textContent);
    expect(opciones).toEqual([
      'Seleccioná el tipo',
      'Autorización de padres/tutores',
      'Certificado médico de aptitud física (renovación)',
    ]);
  });

  it('"Cargar" en un faltante preselecciona su tipo y carga el documento', async () => {
    const user = userEvent.setup();
    const { texto, iso } = fechaFutura();
    render(<DocumentacionParticipante persona={persona} />);

    await user.click(screen.getByRole('button', { name: 'Cargar' }));
    expect(screen.getByLabelText('Tipo de documento')).toHaveValue('AUTORIZACION_PADRES_TUTORES');

    await user.type(screen.getByLabelText('Fecha de vencimiento'), texto);
    await user.click(screen.getByRole('button', { name: 'Cargar documento' }));

    await waitFor(() => {
      expect(crearMock).toHaveBeenCalledWith({
        payload: { tipoDocumento: 'AUTORIZACION_PADRES_TUTORES', fechaVencimiento: iso, personaId: 10 },
        archivo: null,
      });
    });
  });

  it('no envía sin tipo ni fecha de vencimiento', async () => {
    const user = userEvent.setup();
    render(<DocumentacionParticipante persona={persona} />);

    await user.click(screen.getByRole('button', { name: 'Cargar documento' }));

    expect(await screen.findByText('Seleccioná el tipo de documento')).toBeInTheDocument();
    expect(screen.getByText('La fecha de vencimiento es obligatoria')).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('sin permiso de carga solo muestra el estado', () => {
    render(<DocumentacionParticipante persona={persona} puedeCargar={false} />);

    expect(screen.queryByRole('button', { name: 'Cargar documento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar' })).not.toBeInTheDocument();
  });

  it('avisa si las disciplinas del participante no exigen documentación', () => {
    mockHook(useEstadoDocumental).mockReturnValue({
      data: { ...estado, estado: 'HABILITADO', tiposExigidos: [], inscripciones: [{ ...estado.inscripciones[0], estado: 'HABILITADO', motivos: [], documentos: [] }] },
      isLoading: false,
    });
    render(<DocumentacionParticipante persona={persona} />);

    expect(screen.getByText('No exige documentación.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de documento')).not.toBeInTheDocument();
  });
});
