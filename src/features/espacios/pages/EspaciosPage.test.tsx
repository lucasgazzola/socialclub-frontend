import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EspaciosPage } from './EspaciosPage';
import { espaciosApi } from '../api/espacios.api';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    usuario: { id: 1, nombre: 'Admin', apellido: 'Club', roles: ['ADMIN'] },
  }),
}));

vi.mock('@/features/disciplinas/hooks/useDisciplinasActivas', () => ({
  useDisciplinasActivas: () => ({
    disciplinas: [
      { id: 1, nombre: 'Fútbol', categorias: [] },
      { id: 2, nombre: 'Pádel', categorias: [] },
    ],
    cargando: false,
    error: null,
  }),
}));

vi.mock('../api/espacios.api', () => ({
  espaciosApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    agregarBloqueo: vi.fn(),
  },
}));

describe('US-55 · EspaciosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(espaciosApi.list).mockResolvedValue([
      {
        id: 1,
        nombre: 'Cancha de Fútbol 5 Norte',
        tipo: 'DEPORTIVO',
        capacidadMaxima: 12,
        modalidad: 'POR_HORA',
        ubicacion: 'Sector Norte',
        descripcion: 'Sintético',
        precio: 15000,
        precioSocio: 10000,
        montoSena: 5000,
        activo: true,
        disciplinas: [{ disciplina: { id: 1, nombre: 'Fútbol' } }],
      },
      {
        id: 2,
        nombre: 'Salón de Eventos',
        tipo: 'SOCIAL',
        capacidadMaxima: 100,
        modalidad: 'DIA_COMPLETO',
        ubicacion: 'Sede Central',
        descripcion: null,
        precio: 90000,
        precioSocio: null,
        montoSena: 30000,
        activo: true,
        disciplinas: [],
      },
    ]);
  });

  it('muestra el listado de espacios físicos y permite abrir el modal de alta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EspaciosPage />);

    expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();
    expect(screen.getByText('Salón de Eventos')).toBeInTheDocument();
    expect(screen.getByText('Fútbol')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nuevo espacio/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nuevo espacio físico')).toBeInTheDocument();
  });

  it('Criterio 5: muestra advertencia con el código de reserva cuando POST /espacios/:id/bloqueos responde 409', async () => {
    const user = userEvent.setup();
    const err409 = Object.assign(
      new Error(
        'El bloqueo entra en conflicto con la reserva particular aprobada RES-SEED01. Debe gestionar la cancelación manual justificada de la reserva antes de bloquear el turno.',
      ),
      { status: 409 },
    );
    vi.mocked(espaciosApi.agregarBloqueo).mockRejectedValue(err409);

    renderWithProviders(<EspaciosPage />);

    expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();

    const botonesBloqueos = screen.getAllByRole('button', { name: /Bloqueos/i });
    await user.click(botonesBloqueos[0]);

    expect(
      screen.getByText(/Configurar bloqueo · Cancha de Fútbol 5 Norte/i),
    ).toBeInTheDocument();

    // Seleccionar Puntual y completar
    await user.selectOptions(screen.getByLabelText(/Tipo de bloqueo/i), 'PUNTUAL');
    await user.type(screen.getByLabelText(/Fecha específica/i), '2026-11-20');
    await user.type(screen.getByLabelText(/Motivo del bloqueo/i), 'Mantenimiento');

    await user.click(screen.getByRole('button', { name: /Guardar bloqueo/i }));

    await waitFor(() => {
      expect(espaciosApi.agregarBloqueo).toHaveBeenCalledWith(1, {
        tipo: 'PUNTUAL',
        fecha: '2026-11-20',
        horaInicio: '18:00',
        horaFin: '20:00',
        motivo: 'Mantenimiento',
      });
    });

    const alerta = await screen.findByTestId('alerta-conflicto-bloqueo');
    expect(alerta).toHaveTextContent(/Conflicto con reserva aprobada/i);
    expect(alerta).toHaveTextContent(/RES-SEED01/);
  });
});
