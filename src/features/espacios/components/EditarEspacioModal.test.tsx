import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EditarEspacioModal } from './EditarEspacioModal';
import { espaciosApi } from '../api/espacios.api';
import type { Espacio } from '../types';

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
    update: vi.fn(),
    agregarBloqueo: vi.fn(),
    updateBloqueo: vi.fn(),
    deleteBloqueo: vi.fn(),
  },
}));

describe('US-56 · Editar espacio y bloqueos de agenda', () => {
  const espacioBase: Espacio = {
    id: 1,
    nombre: 'Cancha de Fútbol 5',
    tipo: 'DEPORTIVO',
    capacidadMaxima: 12,
    modalidad: 'POR_HORA',
    ubicacion: 'Predio deportivo',
    descripcion: 'Pasto sintético',
    precio: 15000,
    precioSocio: 10000,
    montoSena: 5000,
    activo: true,
    disciplinas: [{ disciplina: { id: 1, nombre: 'Fútbol' } }],
    bloqueos: [
      {
        id: 10,
        espacioId: 1,
        tipo: 'RECURRENTE',
        diasSemana: [1, 3, 5],
        fecha: null,
        horaInicio: '18:00',
        horaFin: '20:00',
        vigenteDesde: '2026-01-01',
        vigenteHasta: '2026-12-31',
        disciplinaId: 1,
        disciplina: { id: 1, nombre: 'Fútbol' },
        motivo: 'Entrenamiento juveniles',
        activo: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(espaciosApi.getById).mockResolvedValue(espacioBase);
    vi.mocked(espaciosApi.update).mockResolvedValue(espacioBase);
  });

  it('permite modificar los datos generales de un espacio existente', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    renderWithProviders(
      <EditarEspacioModal
        espacio={espacioBase}
        open={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />,
    );

    const inputNombre = screen.getByLabelText(/Nombre del espacio/i);
    expect(inputNombre).toHaveValue('Cancha de Fútbol 5');

    await user.clear(inputNombre);
    await user.type(inputNombre, 'Cancha de Fútbol 5 Renovada');

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(espaciosApi.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nombre: 'Cancha de Fútbol 5 Renovada',
          tipo: 'DEPORTIVO',
          capacidadMaxima: 12,
        }),
      );
    });

    expect(handleSuccess).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('si el tipo cambia a SOCIAL, oculta el selector de disciplinas y muestra el aviso reglamentario', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EditarEspacioModal
        espacio={espacioBase}
        open={true}
        onClose={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Tipo de espacio/i), 'SOCIAL');

    expect(await screen.findByTestId('aviso-disciplinas-social')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Fútbol/i })).not.toBeInTheDocument();
  });

  it('permite gestionar bloqueos de agenda y muestra alerta 409 si choca con reserva aprobada', async () => {
    const user = userEvent.setup();

    const err409 = Object.assign(
      new Error(
        'El bloqueo modificado entra en conflicto con la reserva particular aprobada RES-CONF01.',
      ),
      { status: 409 },
    );
    vi.mocked(espaciosApi.updateBloqueo).mockRejectedValue(err409);

    renderWithProviders(
      <EditarEspacioModal
        espacio={espacioBase}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // Ir a pestaña de Bloqueos de agenda
    await user.click(screen.getByRole('button', { name: /Bloqueos de agenda/i }));

    expect(screen.getByText('Entrenamiento juveniles')).toBeInTheDocument();

    // Abrir edición del bloqueo
    const btnEditarBloqueo = screen.getByTitle('Editar bloqueo');
    await user.click(btnEditarBloqueo);

    expect(screen.getByText('Modificar bloqueo de agenda')).toBeInTheDocument();

    // Guardar cambios del bloqueo
    await user.click(screen.getByRole('button', { name: /Actualizar bloqueo/i }));

    const alerta = await screen.findByTestId('alerta-conflicto-bloqueo');
    expect(alerta).toHaveTextContent(/RES-CONF01/);
  });
});
