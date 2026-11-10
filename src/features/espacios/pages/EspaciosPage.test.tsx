import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { EspaciosPage } from './EspaciosPage';
import { espaciosApi } from '../api/espacios.api';
import type { Espacio } from '../types';

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
    update: vi.fn(),
    remove: vi.fn(),
    agregarBloqueo: vi.fn(),
    updateBloqueo: vi.fn(),
    deleteBloqueo: vi.fn(),
  },
}));

describe('US-58 · Consultar espacios y Catálogo público', () => {
  const espaciosMock: Espacio[] = [
    {
      id: 1,
      nombre: 'Cancha de Fútbol 5 Norte',
      tipo: 'DEPORTIVO',
      capacidadMaxima: 12,
      modalidad: 'POR_HORA',
      ubicacion: 'Sector Norte',
      descripcion: 'Césped sintético iluminado',
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
      descripcion: 'Salón con aire acondicionado',
      precio: 90000,
      precioSocio: null,
      montoSena: 30000,
      activo: true,
      disciplinas: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(espaciosApi.list).mockResolvedValue({
      items: espaciosMock,
      total: 2,
      pagina: 1,
      porPagina: 10,
      counts: { todos: 2, activos: 2, inactivos: 0 },
    });
    vi.mocked(espaciosApi.remove).mockResolvedValue({
      mensaje: 'Espacio dado de baja exitosamente',
      id: 1,
    });
  });

  it('muestra la grilla administrativa por defecto para rol ADMIN con StatusTabs y columnas ordenables', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EspaciosPage />);

    expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();
    expect(screen.getByText('Salón de Eventos')).toBeInTheDocument();
    expect(screen.getByText('Fútbol')).toBeInTheDocument();

    // Verificación de tabs de estado con counts
    expect(screen.getByRole('tab', { name: /^Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Activos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Inactivos/i })).toBeInTheDocument();

    // Botón de alta presente
    await user.click(screen.getByRole('button', { name: /Nuevo espacio/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nuevo espacio físico')).toBeInTheDocument();
  });

  it('permite alternar a la vista Catálogo y muestra tarjetas con tarifas diferenciadas y botón de alquiler', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EspaciosPage />);

    expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();

    // Alternar a vista Catálogo
    const btnCatalogo = screen.getByRole('radio', { name: /Catálogo/i });
    await user.click(btnCatalogo);

    // Debe mostrar tarjetas de catálogo
    expect(await screen.findByTestId('catalogo-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('catalogo-card-2')).toBeInTheDocument();

    // Datos del espacio en la tarjeta
    expect(screen.getByText('12 personas')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Solicitar alquiler/i })).toHaveLength(2);
  });

  it('muestra mensaje claro cuando no hay resultados en el catálogo', async () => {
    vi.mocked(espaciosApi.list).mockResolvedValue({
      items: [],
      total: 0,
      pagina: 1,
      porPagina: 10,
      counts: { todos: 0, activos: 0, inactivos: 0 },
    });

    renderWithProviders(<EspaciosPage />);

    const user = userEvent.setup();
    const btnCatalogo = await screen.findByRole('radio', { name: /Catálogo/i });
    await user.click(btnCatalogo);

    expect(await screen.findByText('No se encontraron resultados')).toBeInTheDocument();
  });

  it('Criterio 5 (US-55): muestra advertencia cuando POST /espacios/:id/bloqueos responde 409', async () => {
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

  describe('US-57 · Eliminar espacio (Baja lógica)', () => {
    it('muestra diálogo de confirmación y llama a DELETE /espacios/:id al confirmar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EspaciosPage />);

      expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();

      const botonesEliminar = screen.getAllByRole('button', { name: /Dar de baja/i });
      await user.click(botonesEliminar[0]);

      // Verifica apertura del modal de confirmación
      expect(
        screen.getByText(/¿Estás seguro de que deseás dar de baja el espacio/i),
      ).toBeInTheDocument();

      // Botón destructivo en el modal
      const modalDialog = screen.getByRole('dialog');
      const btnConfirmar = within(modalDialog).getByRole('button', { name: 'Dar de baja' });
      await user.click(btnConfirmar);

      await waitFor(() => {
        expect(espaciosApi.remove).toHaveBeenCalledWith(1);
      });

      expect(
        await screen.findByText(/El espacio "Cancha de Fútbol 5 Norte" fue dado de baja correctamente/i),
      ).toBeInTheDocument();
    });

    it('maneja conflicto 409 cuando hay reservas futuras y muestra alerta explicativa', async () => {
      const user = userEvent.setup();
      const err409 = Object.assign(
        new Error(
          'No se puede dar de baja el espacio porque tiene reservas futuras activas o pendientes (RES-001, RES-002). Debe resolverlas o cancelarlas previamente.',
        ),
        {
          response: {
            status: 409,
            data: {
              message:
                'No se puede dar de baja el espacio porque tiene reservas futuras activas o pendientes (RES-001, RES-002). Debe resolverlas o cancelarlas previamente.',
            },
          },
        },
      );
      vi.mocked(espaciosApi.remove).mockRejectedValue(err409);

      renderWithProviders(<EspaciosPage />);

      expect(await screen.findByText('Cancha de Fútbol 5 Norte')).toBeInTheDocument();

      const botonesEliminar = screen.getAllByRole('button', { name: /Dar de baja/i });
      await user.click(botonesEliminar[0]);

      const modalDialog = screen.getByRole('dialog');
      const btnConfirmar = within(modalDialog).getByRole('button', { name: 'Dar de baja' });
      await user.click(btnConfirmar);

      const alerta = await screen.findByTestId('alerta-conflicto-baja');
      expect(alerta).toHaveTextContent(/RES-001, RES-002/);
      expect(alerta).toHaveTextContent(/No es posible dar de baja el espacio/i);
    });
  });
});
