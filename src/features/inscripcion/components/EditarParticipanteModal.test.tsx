import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditarParticipanteModal } from './EditarParticipanteModal';
import { toast } from 'sonner';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

let mockUseInscripcionesReturn: any = {};
vi.mock('../hooks/useInscripciones', () => ({
  useInscripcionesPorPersona: () => mockUseInscripcionesReturn,
}));

let mockUseDisciplinasActivasReturn: any = {};
vi.mock('../../disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => mockUseDisciplinasActivasReturn,
}));

const mockCrearInscripcion = vi.fn();
vi.mock('../hooks/useCrearInscripcion', () => ({
  useCrearInscripcion: () => ({
    enviar: mockCrearInscripcion,
    enviando: false,
  }),
}));

const mockActualizarInscripcion = vi.fn();
vi.mock('../hooks/useActualizarInscripcion', () => ({
  useActualizarInscripcion: () => ({
    mutateAsync: mockActualizarInscripcion,
    isPending: false,
  }),
}));

const mockEliminarInscripcion = vi.fn();
vi.mock('../hooks/useEliminarInscripcion', () => ({
  useEliminarInscripcion: () => ({
    mutateAsync: mockEliminarInscripcion,
    isPending: false,
  }),
}));

const mockActualizarDatosPersona = vi.fn();
vi.mock('../api/inscripcion.api', () => ({
  actualizarDatosPersona: (...args: any[]) => mockActualizarDatosPersona(...args),
}));

vi.mock('@/features/documentacion/components/DocumentacionParticipante', () => ({
  DocumentacionParticipante: ({ persona }: any) => (
    <div data-testid="doc-participante">Documentación de {persona.nombre}</div>
  ),
}));

describe('EditarParticipanteModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDisciplinasActivasReturn = {
      disciplinas: [
        {
          id: 1,
          nombre: 'Fútbol',
          categorias: [{ id: 10, nombre: 'Juvenil', activo: true }],
        },
        {
          id: 2,
          nombre: 'Básquet',
          categorias: [{ id: 20, nombre: 'Cadetes', activo: true }],
        },
      ],
      cargando: false,
    };
    mockUseInscripcionesReturn = {
      data: [
        {
          id: 100,
          personaId: 5,
          disciplinaId: 1,
          categoriaDisciplinaId: 10,
          activo: true,
          persona: {
            id: 5,
            nombre: 'Juan',
            apellido: 'Perez',
            dni: '40123456',
            fechaNacimiento: '2000-01-01T00:00:00Z',
            genero: 'MASCULINO',
            email: 'juan@test.com',
            telefono: '11223344',
            activo: true,
          },
        },
      ],
      isLoading: false,
      error: null,
    };
  });

  it('no muestra el modal si personaId es null', () => {
    renderWithProviders(
      <EditarParticipanteModal personaId={null} onClose={onClose} />,
    );
    expect(screen.queryByText('Editar participante')).not.toBeInTheDocument();
  });

  it('muestra spinner cuando está cargando inscripciones', () => {
    mockUseInscripcionesReturn = {
      data: null,
      isLoading: true,
      error: null,
    };

    renderWithProviders(
      <EditarParticipanteModal personaId={5} onClose={onClose} />,
    );

    expect(document.body.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('informa y permite ir a editar socio si no tiene inscripciones', async () => {
    const user = userEvent.setup();
    mockUseInscripcionesReturn = {
      data: [],
      isLoading: false,
      error: null,
    };

    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    expect(
      screen.getByText(/Esta persona no tiene inscripciones en disciplinas/i),
    ).toBeInTheDocument();

    const btnSocio = screen.getByRole('button', { name: /Ir a editar socio/i });
    await user.click(btnSocio);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/socios?editar=5');
  });

  it('guarda los cambios del participante y sus disciplinas', async () => {
    const user = userEvent.setup();
    mockActualizarInscripcion.mockResolvedValueOnce({});

    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    expect(screen.getByText('Perez, Juan')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockActualizarInscripcion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 100,
          payload: expect.objectContaining({
            nombre: 'Juan',
            apellido: 'Perez',
            dni: '40123456',
          }),
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Participante actualizado correctamente');
    expect(onClose).toHaveBeenCalled();
  });

  it('cambio de disciplina resetea categoriaDisciplinaId', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    // Inicialmente tiene Fútbol (id 1) y Juvenil (id 10)
    const selectDisciplina = screen.getByDisplayValue('Fútbol') as HTMLSelectElement;
    expect(selectDisciplina.value).toBe('1');

    const selectCategoria = screen.getByDisplayValue('Juvenil') as HTMLSelectElement;
    expect(selectCategoria.value).toBe('10');

    // Cambiamos a Básquet (id 2)
    await user.selectOptions(selectDisciplina, '2');

    // La categoría debe resetearse a la opción por defecto
    expect(screen.getByDisplayValue('Seleccioná una categoría')).toBeInTheDocument();
  });

  it('Cancelar tras quitar una disciplina no dispara la eliminación en backend', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    // Click en el botón de tacho de basura
    const btnEliminar = container.querySelector('.text-red-600') as HTMLButtonElement;
    await user.click(btnEliminar);

    // Click en Cancelar
    const btnCancelar = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(btnCancelar);

    expect(mockEliminarInscripcion).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('guardar maneja errores y muestra toast de error sin cerrar el modal', async () => {
    const user = userEvent.setup();
    mockActualizarInscripcion.mockRejectedValueOnce(new Error('Conflicto al guardar'));

    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Conflicto al guardar');
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('al agregar una disciplina nueva envía personaId al crearla', async () => {
    const user = userEvent.setup();
    mockActualizarInscripcion.mockResolvedValueOnce({});
    mockCrearInscripcion.mockResolvedValueOnce({});

    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    // Agregar nueva disciplina
    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));

    const selectNueva = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    // Seleccionamos Básquet (id 2) para la nueva fila
    await user.selectOptions(selectNueva, '2');

    // Seleccionamos Cadetes (id 20)
    const selectCategoriaNueva = screen.getByDisplayValue('Seleccioná una categoría') as HTMLSelectElement;
    await user.selectOptions(selectCategoriaNueva, '20');

    // Guardar
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(mockCrearInscripcion).toHaveBeenCalledWith(
        expect.objectContaining({
          personaId: 5,
          disciplinaId: 2,
          categoriaDisciplinaId: 20,
        }),
      );
    });
  });

  it('muestra Categoría visible con opciones válidas según edad/género y envía categoriaDisciplinaId al guardar', async () => {
    const user = userEvent.setup();
    mockActualizarInscripcion.mockResolvedValueOnce({});
    mockCrearInscripcion.mockResolvedValueOnce({});
    mockUseDisciplinasActivasReturn = {
      disciplinas: [
        {
          id: 1,
          nombre: 'Fútbol',
          categorias: [{ id: 10, nombre: 'Juvenil', activo: true }],
        },
        {
          id: 3,
          nombre: 'Gimnasio',
          categorias: [
            { id: 30, nombre: 'Libre', activo: true, edadMinima: 16 },
          ],
        },
      ],
      cargando: false,
    };

    // Participante nacido en 2000-01-01 (26 años >= 16)
    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));
    const selectNueva = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    await user.selectOptions(selectNueva, '3'); // Gimnasio

    const selectCat = screen.getByDisplayValue('Seleccioná una categoría') as HTMLSelectElement;
    expect(selectCat).not.toBeDisabled();
    expect(screen.getByRole('option', { name: 'Libre' })).toBeInTheDocument();

    await user.selectOptions(selectCat, '30'); // Libre
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(mockCrearInscripcion).toHaveBeenCalledWith(
        expect.objectContaining({
          personaId: 5,
          disciplinaId: 3,
          categoriaDisciplinaId: 30,
        }),
      );
    });
  });

  it('deshabilita Categoría con mensaje si el participante no cumple edad/género para ninguna categoría activa', async () => {
    const user = userEvent.setup();
    mockUseDisciplinasActivasReturn = {
      disciplinas: [
        {
          id: 1,
          nombre: 'Fútbol',
          categorias: [{ id: 10, nombre: 'Juvenil', activo: true }],
        },
        {
          id: 4,
          nombre: 'Fútbol Femenino',
          categorias: [
            { id: 40, nombre: 'Única', activo: true, genero: 'FEMENINO' },
          ],
        },
      ],
      cargando: false,
    };

    // Participante es MASCULINO
    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));
    const selectNueva = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    await user.selectOptions(selectNueva, '4'); // Fútbol Femenino

    const selectSinCat = screen.getByDisplayValue('No hay categorías que cumplan edad/género') as HTMLSelectElement;
    expect(selectSinCat).toBeDisabled();
  });

  it('no muestra el selector de Categoría si la disciplina solo tiene categorías inactivas', async () => {
    const user = userEvent.setup();
    mockUseDisciplinasActivasReturn = {
      disciplinas: [
        {
          id: 1,
          nombre: 'Fútbol',
          categorias: [{ id: 10, nombre: 'Juvenil', activo: true }],
        },
        {
          id: 5,
          nombre: 'Ajedrez',
          categorias: [
            { id: 50, nombre: 'Antigua', activo: false },
          ],
        },
      ],
      cargando: false,
    };

    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    // Inicialmente hay 1 selector de categoría (de Fútbol)
    expect(screen.getAllByText('Categoría')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));
    const selectNueva = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    await user.selectOptions(selectNueva, '5'); // Ajedrez

    // Sigue habiendo solo 1 selector de categoría (Ajedrez no muestra Categoría)
    expect(screen.getAllByText('Categoría')).toHaveLength(1);
  });

  it('si se quita una disciplina existente y se vuelve a agregar en la misma edición, guarda correctamente', async () => {
    const user = userEvent.setup();
    mockActualizarInscripcion.mockResolvedValueOnce({});

    const { container } = renderWithProviders(
      <EditarParticipanteModal personaId={5} onClose={onClose} />,
    );

    // Quitar Fútbol (inscripcionId: 100)
    const btnEliminar = container.querySelector('.text-red-600') as HTMLButtonElement;
    await user.click(btnEliminar);

    // Volver a agregar Fútbol
    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));
    const selectNueva = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    await user.selectOptions(selectNueva, '1');

    const selectCat = screen.getByDisplayValue('Seleccioná una categoría') as HTMLSelectElement;
    await user.selectOptions(selectCat, '10');

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Participante actualizado correctamente');
    });

    expect(onClose).toHaveBeenCalled();
  });
});
