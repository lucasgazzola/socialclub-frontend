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
    expect(mockNavigate).toHaveBeenCalledWith('/socios?editar=5');
  });

  it('permite cambiar a la pestaña de documentación', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarParticipanteModal personaId={5} onClose={onClose} />);

    expect(screen.getByText('Datos y disciplinas')).toBeInTheDocument();

    const tabDoc = screen.getByRole('tab', { name: /Documentación/i });
    await user.click(tabDoc);

    expect(screen.getByTestId('doc-participante')).toBeInTheDocument();
    expect(screen.getByText('Documentación de Juan')).toBeInTheDocument();
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
});
