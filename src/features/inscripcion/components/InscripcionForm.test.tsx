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
const busquedaMock = { buscar: buscarMock, limpiar: limpiarMock, cargando: false, noEncontrado: false };

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
      {
        id: 1,
        nombre: 'Fútbol',
        activo: true,
        categorias: [
          { id: 7, nombre: 'Sub-15', activo: true, genero: 'FEMENINO', edadMinima: 13, edadMaxima: 15 },
          { id: 8, nombre: 'Veteranos', activo: true, genero: 'MASCULINO', edadMinima: 40, edadMaxima: null },
        ],
      },
      { id: 2, nombre: 'Ajedrez', activo: true, categorias: [] },
    ],
  }),
}));
vi.mock('../api/inscripcion.api', () => ({ obtenerRequisitos: vi.fn() }));
vi.mock('@/features/documentacion/api/documentacion.api', () => ({
  documentacionApi: {
    crear: vi.fn().mockResolvedValue({ id: 1 }),
    estadoPorPersona: vi.fn(),
  },
}));

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
  cuotaGenerada: {
    periodo: '2026-10',
    monto: 15000,
    montoTarifa: 15000,
    descuentoSocioPorcentaje: 0,
    esSocio: false,
    sinTarifa: false,
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
    await user.click(screen.getByRole('button', { name: 'Registrar participante' }));

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

    await user.type(screen.getByLabelText('Fecha de nacimiento'), '03052012');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
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

    expect(await screen.findByText('Gómez, Lola')).toBeInTheDocument();
    expect(screen.getByText('DNI 50111222')).toBeInTheDocument();
    expect(screen.getByText('Fecha de nacimiento: 03/05/2012')).toBeInTheDocument();
    // Solo se busca el DNI completo, no el prefijo de 7 dígitos mientras se tipea.
    expect(buscarMock).toHaveBeenCalledTimes(1);
    expect(buscarMock).toHaveBeenCalledWith('50111222');
    // Para participante existente, se muestran sus datos en la barra azul y no los campos individuales
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Apellido')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await user.click(screen.getByRole('button', { name: 'Inscribir' }));

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
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '03052012');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.click(screen.getByRole('button', { name: 'Registrar participante' }));

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

    expect(screen.getByText('Gómez, Lola')).toBeInTheDocument();
    expect(screen.getByText('DNI 50111222')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.selectOptions(screen.getByLabelText('Categoría'), '7');
    await user.click(screen.getByRole('button', { name: 'Inscribir' }));

    expect(await screen.findByText('Lola Gómez quedó inscripto correctamente.')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de documentación')).toBeInTheDocument();
    expect(screen.getByText('Certificado médico de aptitud física: falta presentarlo hasta el 31/10/2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cargar documentación/ }));
    expect(onCargarDocumentacion).toHaveBeenCalledWith(creada.persona);
  });

  it('avisa que un DNI que no existe registra a un participante nuevo', async () => {
    const user = userEvent.setup();
    busquedaMock.noEncontrado = true;
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '47123456');

    expect(await screen.findByText('DNI nuevo: se va a registrar un participante nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar participante' })).toBeInTheDocument();
    busquedaMock.noEncontrado = false;
  });

  it('"Usar otro DNI" descarta a la persona encontrada', async () => {
    const user = userEvent.setup();
    buscarMock.mockImplementation(async (dni: string) => ({
      participante:
        dni === '50111222'
          ? { id: 20, dni, nombre: 'Lola', apellido: 'Gómez', fechaNacimiento: null, genero: null, email: null, telefono: null, inscripciones: [] }
          : null,
    }));
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    expect(await screen.findByText('Gómez, Lola')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Usar otro DNI' }));

    expect(screen.queryByText('Gómez, Lola')).not.toBeInTheDocument();
    expect(screen.getByLabelText('DNI')).toHaveValue('');
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeEnabled();
  });

  it('muestra el email repetido una sola vez, en el campo email', async () => {
    const user = userEvent.setup();
    enviarMock.mockRejectedValue(new Error('El email ya está registrado por otra persona'));
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '47123456');
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo');
    await user.type(screen.getByLabelText('Apellido'), 'Prueba');
    await user.type(screen.getByLabelText('Email'), 'admin@socialclub.local');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await user.click(screen.getByRole('button', { name: 'Registrar participante' }));

    expect(await screen.findAllByText('El email ya está registrado por otra persona')).toHaveLength(1);
    expect(screen.getByLabelText('Email')).toHaveClass('border-rose-400');
  });

  it('permite adjuntar documentación faltante en la misma operación de alta (Criterio 7)', async () => {
    const user = userEvent.setup();
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    await user.type(screen.getByLabelText('Nombre'), 'Lola');
    await user.type(screen.getByLabelText('Apellido'), 'Gómez');
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '03052012');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');
    await user.selectOptions(screen.getByLabelText('Categoría'), '7');

    const btnCargar = await screen.findByRole('button', { name: 'Cargar' });
    expect(btnCargar).toBeInTheDocument();
    await user.click(btnCargar);

    const inputVencimiento = screen.getByLabelText(/Fecha de vencimiento/);
    expect(inputVencimiento).toBeInTheDocument();
    await user.type(inputVencimiento, '31122026');

    const file = new File(['contenido'], 'certificado.pdf', { type: 'application/pdf' });
    const inputFile = screen.getByLabelText(/Archivo para Certificado médico/);
    await user.upload(inputFile, file);

    await user.click(screen.getByRole('button', { name: 'Registrar participante' }));

    await waitFor(() => {
      expect(enviarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          documentos: [
            expect.objectContaining({
              tipoDocumento: 'CERTIFICADO_MEDICO_APTITUD_FISICA',
              fechaVencimiento: '2026-12-31',
            }),
          ],
        }),
      );
    });
  });

  it('muestra la cuota deportiva generada y estado habilitada cuando se completan requisitos (Criterios 9 y 10)', async () => {
    const user = userEvent.setup();
    enviarMock.mockResolvedValueOnce({
      ...creada,
      estadoDocumental: {
        ...creada.estadoDocumental,
        estado: 'HABILITADO',
        motivos: [],
      },
      cuotaGenerada: {
        periodo: '2026-10',
        monto: 12000,
        montoTarifa: 15000,
        descuentoSocioPorcentaje: 20,
        esSocio: true,
        sinTarifa: false,
      },
    });

    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    await user.type(screen.getByLabelText('Nombre'), 'Lola');
    await user.type(screen.getByLabelText('Apellido'), 'Gómez');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '2');
    await user.click(screen.getByRole('button', { name: 'Registrar participante' }));

    expect(await screen.findByText('Toda la documentación requerida fue presentada.')).toBeInTheDocument();
    expect(screen.getByText(/Cuota deportiva/)).toBeInTheDocument();
    expect(screen.getByText('$12.000')).toBeInTheDocument();
    expect(screen.getByText(/20% de descuento por ser socio/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nueva inscripción' })).not.toBeInTheDocument();
  });

  it('no muestra como opción las categorías que no cumplen restricciones de edad o género', async () => {
    const user = userEvent.setup();
    renderForm(<InscripcionForm />);

    await user.type(screen.getByLabelText('DNI'), '50111222');
    await user.type(screen.getByLabelText('Nombre'), 'Lola');
    await user.type(screen.getByLabelText('Apellido'), 'Gómez');
    // Lola: 14 años (2012) y FEMENINO
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '03052012');
    await user.selectOptions(screen.getByLabelText('Género'), 'FEMENINO');
    await user.selectOptions(screen.getByLabelText('Disciplina'), '1');

    const selectCategoria = screen.getByLabelText('Categoría');
    expect(within(selectCategoria).getByRole('option', { name: /Sub-15/ })).toBeInTheDocument();
    // 'Veteranos' (MASCULINO, min 40 años) no debe aparecer
    expect(within(selectCategoria).queryByRole('option', { name: /Veteranos/ })).not.toBeInTheDocument();
  });
});
