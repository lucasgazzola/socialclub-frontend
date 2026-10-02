import type { ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InscripcionForm } from './InscripcionForm';
import { obtenerRequisitos } from '../api/inscripcion.api';
import type { InscripcionCreada, ParticipanteEncontrado } from '../types';

const enviarMock = vi.fn();
const buscarMock = vi.fn();
const limpiarMock = vi.fn();
// Como el hook real (useCallback), las funciones son estables entre renders.
const busquedaMock = { buscar: buscarMock, limpiar: limpiarMock, cargando: false };

vi.mock('../hooks/useCrearInscripcion', () => ({
  useCrearInscripcion: () => ({ enviar: enviarMock, enviando: false, error: null }),
}));
vi.mock('../hooks/useBuscarParticipante', () => ({
  useBuscarParticipante: () => busquedaMock,
}));
vi.mock('../../disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    cargando: false,
    disciplinas: [
      { id: 1, nombre: 'Fútbol', activo: true, categorias: [{ id: 7, nombre: 'Sub-15', activo: true }] },
      { id: 2, nombre: 'Ajedrez', activo: true, categorias: [] },
    ],
  }),
}));
vi.mock('../api/inscripcion.api', () => ({ obtenerRequisitos: vi.fn() }));

const requisitosFutbol = {
  restricciones: { genero: 'FEMENINO', edadMinima: 13, edadMaxima: 15 },
  documentacion: {
    estado: 'PENDIENTE',
    motivos: [],
    habilitadoExcepcionalmenteHasta: null,
    documentos: [
      {
        tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
        etiqueta: 'Certificado médico de aptitud física',
        origen: 'DISCIPLINA',
        plazoDiasTolerancia: 30,
        estado: 'FALTANTE',
        documentoId: null,
        fechaVencimiento: null,
        fechaLimite: '2026-10-31T03:00:00.000Z',
      },
    ],
  },
};

const creada: InscripcionCreada = {
  persona: { id: 20, nombre: 'Lola', apellido: 'Gómez', dni: '50111222' },
  inscripcion: { id: 99, disciplinaId: 1, categoriaDisciplinaId: 7 },
  estadoDocumental: {
    inscripcionId: 99,
    disciplina: { id: 1, nombre: 'Fútbol' },
    categoriaDisciplina: { id: 7, nombre: 'Sub-15' },
    estado: 'PENDIENTE',
    motivos: ['Certificado médico de aptitud física: falta presentarlo hasta el 31/10/2026'],
    habilitadoExcepcionalmenteHasta: null,
    documentos: requisitosFutbol.documentacion.documentos as NonNullable<InscripcionCreada['estadoDocumental']>['documentos'],
  },
};

function renderForm(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('US-05 · TASK-31 · InscripcionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buscarMock.mockResolvedValue({ participante: null, noEncontrado: true });
    (obtenerRequisitos as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(requisitosFutbol);
    enviarMock.mockResolvedValue(creada);
  });

  it('carga los datos del participante directamente, sin un paso previo de búsqueda', async () => {
    const user = userEvent.setup();
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    await user.type(screen.getByLabelText('Nombre'), 'Lola');
    await user.type(screen.getByLabelText('Apellido'), 'Gómez');
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '03052012');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.selectOptions(screen.getByLabelText('Categoría'), '7');
    await user.click(screen.getByRole('button', { name: /Confirmar inscripción/ }));

    await waitFor(() => {
      expect(enviarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: '50111222',
          nombre: 'Lola',
          apellido: 'Gómez',
          fechaNacimiento: '2012-05-03',
          genero: 'FEMENINO',
          disciplinaId: 1,
          categoriaDisciplinaId: 7,
          personaId: undefined,
        }),
      );
    });
  });

  it('muestra las restricciones y la documentación exigida al elegir disciplina y categoría', async () => {
    const user = userEvent.setup();
    renderForm(<InscripcionForm />);

    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    expect(obtenerRequisitos).not.toHaveBeenCalled(); // falta la categoría
    await user.selectOptions(screen.getByLabelText('Categoría'), '7');

    const panel = await screen.findByRole('region', { name: 'Requisitos de la inscripción' });
    expect(within(panel).getByText(/Femenino · 13 a 15 años/)).toBeInTheDocument();
    expect(within(panel).getByText('Certificado médico de aptitud física')).toBeInTheDocument();
    expect(within(panel).getByText(/30 días para presentarlo/)).toBeInTheDocument();
    expect(obtenerRequisitos).toHaveBeenCalledWith({ disciplinaId: 1, categoriaDisciplinaId: 7, personaId: undefined });
  });

  it('si el DNI ya está registrado, completa sus datos y lo inscribe a esa persona', async () => {
    const user = userEvent.setup();
    buscarMock.mockImplementation(async (dni: string) => ({
      participante: dni !== '50111222' ? null : {
        id: 20,
        dni: '50111222',
        nombre: 'Lola',
        apellido: 'Gómez',
        fechaNacimiento: '2012-05-03T00:00:00.000Z',
        genero: null,
        email: null,
        telefono: null,
        inscripciones: [],
      },
    }));
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');

    expect(await screen.findByText(/DNI ya registrado: Gómez, Lola/)).toBeInTheDocument();
    // Solo se busca el DNI completo, no el prefijo de 7 dígitos mientras se tipea.
    expect(buscarMock).toHaveBeenCalledTimes(1);
    expect(buscarMock).toHaveBeenCalledWith('50111222');
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toHaveValue('Lola');
      expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('03/05/2012');
    });
    expect(screen.getByLabelText('Nombre')).toBeDisabled();
    // Lo que le falta (género) se puede completar.
    expect(screen.getByLabelText('Género')).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await user.click(screen.getByRole('button', { name: /Confirmar inscripción/ }));

    await waitFor(() => {
      expect(enviarMock).toHaveBeenCalledWith(expect.objectContaining({ personaId: 20, disciplinaId: 2 }));
    });
  });

  it('exige la categoría si la disciplina tiene categorías', async () => {
    const user = userEvent.setup();
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    await user.type(screen.getByLabelText('Nombre'), 'Lola');
    await user.type(screen.getByLabelText('Apellido'), 'Gómez');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.click(screen.getByRole('button', { name: /Confirmar inscripción/ }));

    expect(await screen.findByText('Debe seleccionar una categoría para esta disciplina')).toBeInTheDocument();
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('al confirmar informa qué documentación falta y permite cargarla', async () => {
    const user = userEvent.setup();
    const onCargarDocumentacion = vi.fn();
    const participante: ParticipanteEncontrado = {
      id: 20,
      dni: '50111222',
      nombre: 'Lola',
      apellido: 'Gómez',
      fechaNacimiento: '2012-05-03',
      genero: 'FEMENINO',
      email: null,
      telefono: null,
      inscripciones: [],
    };
    renderForm(<InscripcionForm participante={participante} onCargarDocumentacion={onCargarDocumentacion} />);

    expect(screen.getByText('Gómez, Lola · DNI 50111222')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.selectOptions(screen.getByLabelText('Categoría'), '7');
    await user.click(screen.getByRole('button', { name: /Confirmar inscripción/ }));

    expect(await screen.findByText('Lola Gómez quedó inscripto correctamente.')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de documentación')).toBeInTheDocument();
    expect(screen.getByText('Certificado médico de aptitud física: falta presentarlo hasta el 31/10/2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cargar documentación/ }));
    expect(onCargarDocumentacion).toHaveBeenCalledWith(creada.persona);
  });
});
