import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { DarDeAltaParticipanteModal } from './DarDeAltaParticipanteModal';
import * as inscripcionApi from '../api/inscripcion.api';
import * as useActivarHook from '../hooks/useActivarParticipante';
import * as useDisciplinasHook from '../../disciplinas/hooks/useDisciplinasActivas';
import type { ParticipanteConDisciplinas, PreAltaParticipanteResponse } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockParticipante: ParticipanteConDisciplinas = {
  personaId: 10,
  estado: 'BAJA',
  cantidadDisciplinas: 0,
  persona: {
    id: 10,
    nombre: 'Juan',
    apellido: 'Perez',
    dni: '30123456',
    fechaNacimiento: '2010-05-15',
    genero: 'MASCULINO',
    email: 'juan@test.com',
    telefono: '11223344',
    activo: false,
  },
  disciplinas: [],
};

const mockPreAltaSinDeuda: PreAltaParticipanteResponse = {
  personaId: 10,
  tieneDeuda: false,
  deudaDeportivaTotal: 0,
  cuotasPendientes: [],
  inscripcionesAnteriores: [
    {
      inscripcionId: 101,
      disciplinaId: 1,
      disciplinaNombre: 'Fútbol',
      categoriaDisciplinaId: 11,
      categoriaNombre: 'Juveniles',
      cumpleRestricciones: true,
      motivosBloqueo: [],
    },
    {
      inscripcionId: 102,
      disciplinaId: 2,
      disciplinaNombre: 'Natación',
      categoriaDisciplinaId: 21,
      categoriaNombre: 'Infantiles',
      cumpleRestricciones: false,
      motivosBloqueo: ['Supera la edad máxima de 12 años para Infantiles (edad: 16)'],
    },
  ],
};

const mockPreAltaConDeuda: PreAltaParticipanteResponse = {
  personaId: 10,
  tieneDeuda: true,
  deudaDeportivaTotal: 15000,
  cuotasPendientes: [
    {
      id: 501,
      periodo: '2026-09',
      monto: 15000,
      disciplinaNombre: 'Fútbol',
    },
  ],
  inscripcionesAnteriores: [
    {
      inscripcionId: 101,
      disciplinaId: 1,
      disciplinaNombre: 'Fútbol',
      categoriaDisciplinaId: 11,
      categoriaNombre: 'Juveniles',
      cumpleRestricciones: true,
      motivosBloqueo: [],
    },
  ],
};

const mockDisciplinasActivas = [
  {
    id: 1,
    nombre: 'Fútbol',
    activo: true,
    categorias: [
      { id: 11, nombre: 'Juveniles', activo: true, edadMinima: 13, edadMaxima: 17, genero: 'MASCULINO' },
    ],
  },
  {
    id: 2,
    nombre: 'Natación',
    activo: true,
    categorias: [
      { id: 21, nombre: 'Infantiles', activo: true, edadMinima: 6, edadMaxima: 12, genero: null },
      { id: 22, nombre: 'Juveniles', activo: true, edadMinima: 13, edadMaxima: 18, genero: null },
    ],
  },
  {
    id: 3,
    nombre: 'Básquet',
    activo: true,
    categorias: [
      { id: 31, nombre: 'Primera', activo: true, edadMinima: null, edadMaxima: null, genero: null },
    ],
  },
];

describe('DarDeAltaParticipanteModal', () => {
  const onClose = vi.fn();
  const mockActivar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useDisciplinasHook, 'useDisciplinasActivas').mockReturnValue({
      disciplinas: mockDisciplinasActivas as any,
      cargando: false,
      error: null,
    });
    vi.spyOn(useActivarHook, 'useActivarParticipante').mockReturnValue({
      mutateAsync: mockActivar,
      isPending: false,
    } as any);
  });

  it('no renderiza nada si participante es null', () => {
    renderWithProviders(<DarDeAltaParticipanteModal participante={null} onClose={onClose} />);
    expect(screen.queryByText(/Dar de alta participante/i)).not.toBeInTheDocument();
  });

  it('consulta GET /inscripcion/persona/:personaId/pre-alta y muestra inscripciones anteriores', async () => {
    const preAltaSpy = vi
      .spyOn(inscripcionApi, 'preEvaluarAltaParticipante')
      .mockResolvedValue(mockPreAltaSinDeuda);

    renderWithProviders(
      <DarDeAltaParticipanteModal participante={mockParticipante} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(preAltaSpy).toHaveBeenCalledWith(10);
    });

    expect(await screen.findByText('Fútbol')).toBeInTheDocument();
    expect(screen.getAllByText('Juveniles').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Natación')).toBeInTheDocument();
    expect(screen.getByText('Infantiles')).toBeInTheDocument();
  });

  it('alerta de deuda deportiva si tieneDeuda es true con monto, cuotas y botón a cobrar', async () => {
    vi.spyOn(inscripcionApi, 'preEvaluarAltaParticipante').mockResolvedValue(mockPreAltaConDeuda);
    const user = userEvent.setup();

    renderWithProviders(
      <DarDeAltaParticipanteModal participante={mockParticipante} onClose={onClose} />,
    );

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(/Deuda deportiva pendiente/i);
    expect(alerta).toHaveTextContent(/15\.000/i);
    expect(alerta).toHaveTextContent(/2026-09 · Fútbol/i);

    const btnCobrar = screen.getByRole('button', { name: /Ir a cobrar cuota deportiva/i });
    await user.click(btnCobrar);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin/cuotas/deportiva/cobrar?dni=30123456');
  });

  it('bloquea disciplinas anteriores con cumpleRestricciones: false y muestra motivosBloqueo', async () => {
    vi.spyOn(inscripcionApi, 'preEvaluarAltaParticipante').mockResolvedValue(mockPreAltaSinDeuda);

    renderWithProviders(
      <DarDeAltaParticipanteModal participante={mockParticipante} onClose={onClose} />,
    );

    await screen.findByText('Natación');

    expect(
      screen.getByText(/Supera la edad máxima de 12 años para Infantiles/i),
    ).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    // El checkbox de Natación debe estar deshabilitado
    expect(checkboxes[1]).toBeDisabled();
    // El checkbox de Fútbol está habilitado
    expect(checkboxes[0]).not.toBeDisabled();
  });

  it('permite elegir otra categoría habilitada para una disciplina anterior bloqueada', async () => {
    vi.spyOn(inscripcionApi, 'preEvaluarAltaParticipante').mockResolvedValue(mockPreAltaSinDeuda);
    const user = userEvent.setup();

    renderWithProviders(
      <DarDeAltaParticipanteModal participante={mockParticipante} onClose={onClose} />,
    );

    await screen.findByText('Natación');

    // Select para elegir otra categoría habilitada en Natación (Juveniles de Natación es válida)
    const selectOtraCat = screen.getByRole('combobox');
    await user.selectOptions(selectOtraCat, '22'); // Juveniles (id 22)

    // Confirmar alta
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar alta/i });
    expect(btnConfirmar).not.toBeDisabled();
    await user.click(btnConfirmar);

    await waitFor(() => {
      expect(mockActivar).toHaveBeenCalledWith({
        personaId: 10,
        payload: {
          disciplinas: [
            {
              disciplinaId: 2,
              categoriaDisciplinaId: 22,
            },
          ],
        },
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('permite sumar una disciplina nueva y confirmar alta enviando { disciplinas }', async () => {
    vi.spyOn(inscripcionApi, 'preEvaluarAltaParticipante').mockResolvedValue({
      ...mockPreAltaSinDeuda,
      inscripcionesAnteriores: [],
    });
    const user = userEvent.setup();

    renderWithProviders(
      <DarDeAltaParticipanteModal participante={mockParticipante} onClose={onClose} />,
    );

    // Inicialmente botón confirmar deshabilitado si no hay disciplinas elegidas
    const btnConfirmar = await screen.findByRole('button', { name: /Confirmar alta/i });
    expect(btnConfirmar).toBeDisabled();

    // Agregar disciplina
    await user.click(screen.getByRole('button', { name: /Agregar disciplina/i }));

    const selectDisc = screen.getByDisplayValue('Seleccioná una disciplina') as HTMLSelectElement;
    await user.selectOptions(selectDisc, '3'); // Básquet

    const selectCat = screen.getByDisplayValue('Seleccioná una categoría') as HTMLSelectElement;
    await user.selectOptions(selectCat, '31'); // Primera

    expect(btnConfirmar).not.toBeDisabled();
    await user.click(btnConfirmar);

    await waitFor(() => {
      expect(mockActivar).toHaveBeenCalledWith({
        personaId: 10,
        payload: {
          disciplinas: [
            {
              disciplinaId: 3,
              categoriaDisciplinaId: 31,
            },
          ],
        },
      });
    });

    expect(onClose).toHaveBeenCalled();
  });
});
