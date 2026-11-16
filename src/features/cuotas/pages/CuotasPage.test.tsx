import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { CuotasPage } from './CuotasPage';

const mockDisciplinas = [
  {
    id: 1,
    nombre: 'Fútbol',
    categorias: [{ id: 10, nombre: 'Juveniles' }],
  },
];

const mockUseDisciplinas = vi.fn();
vi.mock('../hooks/useDisciplinas', () => ({
  useDisciplinas: () => mockUseDisciplinas(),
}));

const mockUseCuotas = vi.fn();
vi.mock('../hooks/useCuotas', () => ({
  useCuotas: (params: any) => mockUseCuotas(params),
}));

const mockConfigurarCuota = vi.fn();
vi.mock('../hooks/useConfigurarCuota', () => ({
  useConfigurarCuota: () => ({
    mutateAsync: mockConfigurarCuota,
    isPending: false,
  }),
}));

const mockActualizarCuota = vi.fn();
vi.mock('../hooks/useActualizarCuota', () => ({
  useActualizarCuota: () => ({
    mutateAsync: mockActualizarCuota,
    isPending: false,
  }),
}));

vi.mock('../components/CuotaForm', () => ({
  CuotaForm: ({ modo, onSubmit, onCancel }: any) => (
    <div data-testid="cuota-form-mock">
      <span>Modo: {modo}</span>
      <button
        onClick={() =>
          onSubmit({
            disciplinaId: 1,
            categoriaDisciplinaId: 10,
            monto: 12000,
            descuentoSocioPorcentaje: 15,
            periodoAplicacion: '2026-05',
          })
        }
      >
        Guardar Tarifa Mock
      </button>
      <button onClick={onCancel}>Cancelar Form Mock</button>
    </div>
  ),
}));

vi.mock('../components/CuotasTable', () => ({
  CuotasTable: ({ cuotas, onEditar, onCambiarEstado }: any) => (
    <div data-testid="cuotas-table-mock">
      {cuotas.map((c: any) => (
        <div key={c.id}>
          <span>{c.disciplinaNombre}</span>
          <button onClick={() => onEditar(c)}>Editar {c.id}</button>
          {onCambiarEstado && <button onClick={() => onCambiarEstado(c)}>Cambiar estado {c.id}</button>}
        </div>
      ))}
    </div>
  ),
}));

describe('CuotasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDisciplinas.mockReturnValue({
      data: mockDisciplinas,
      isLoading: false,
    });
    mockUseCuotas.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            disciplinaId: 1,
            disciplinaNombre: 'Fútbol',
            categoriaDisciplinaId: 10,
            categoriaDisciplinaNombre: 'Juveniles',
            monto: 10000,
            descuentoSocioPorcentaje: 10,
            periodoAplicacion: '2026-04',
          },
        ],
        total: 15,
        porPagina: 10,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
  });

  it('muestra spinner durante la carga de cuotas o disciplinas', () => {
    mockUseCuotas.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(<CuotasPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra error si la consulta falla', () => {
    mockUseCuotas.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error de conexión con tarifas'),
    });

    renderWithProviders(<CuotasPage />);
    expect(screen.getByText('Error de conexión con tarifas')).toBeInTheDocument();
  });

  it('renderiza encabezado, tabla y filtros correctamente', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<CuotasPage />);

    expect(screen.getByText('Cuotas deportivas')).toBeInTheDocument();
    expect(screen.getAllByText('Fútbol').length).toBeGreaterThan(0);
    expect(screen.getByText('15 configuración(es)')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    // Filtros
    const selectDisciplina = container.querySelector('#filtroDisciplina') as HTMLSelectElement;
    await user.selectOptions(selectDisciplina, '1');

    expect(mockUseCuotas).toHaveBeenCalledWith(
      expect.objectContaining({
        disciplinaId: 1,
        pagina: 1,
      }),
    );

    const periodoInput = screen.getByLabelText('Filtrar por período');
    await user.type(periodoInput, '2026-06');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(mockUseCuotas).toHaveBeenCalledWith(
      expect.objectContaining({
        periodoAplicacion: '2026-06',
        pagina: 1,
      }),
    );
  });

  it('permite abrir modal de creación y guardar nueva tarifa', async () => {
    const user = userEvent.setup();
    mockConfigurarCuota.mockResolvedValueOnce({});

    renderWithProviders(<CuotasPage />);

    await user.click(screen.getByRole('button', { name: /Configurar tarifa/i }));

    expect(screen.getByTestId('cuota-form-mock')).toBeInTheDocument();
    expect(screen.getByText('Modo: crear')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar Tarifa Mock' }));

    await waitFor(() => {
      expect(mockConfigurarCuota).toHaveBeenCalledWith(
        expect.objectContaining({
          disciplinaId: 1,
          categoriaDisciplinaId: 10,
          monto: 12000,
        }),
      );
    });
  });

  it('permite abrir modal de edición y actualizar tarifa', async () => {
    const user = userEvent.setup();
    mockActualizarCuota.mockResolvedValueOnce({});

    renderWithProviders(<CuotasPage />);

    await user.click(screen.getByRole('button', { name: 'Editar 1' }));

    expect(screen.getByTestId('cuota-form-mock')).toBeInTheDocument();
    expect(screen.getByText('Modo: editar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar Tarifa Mock' }));

    await waitFor(() => {
      expect(mockActualizarCuota).toHaveBeenCalledWith({
        id: 1,
        payload: { monto: 12000, descuentoSocioPorcentaje: 15 },
      });
    });
  });

  describe('DT-05 · activar y desactivar una tarifa', () => {
    const tarifa = (activo: boolean) => ({
      id: 7,
      disciplina: { id: 1, nombre: 'Fútbol' },
      categoriaDisciplina: { id: 10, nombre: 'Juveniles' },
      monto: 10000,
      descuentoSocioPorcentaje: 10,
      periodoAplicacion: '2026-04',
      activo,
    });
    const conTarifa = (activo: boolean) =>
      mockUseCuotas.mockReturnValue({
        data: { items: [tarifa(activo)], total: 1, porPagina: 10 },
        isLoading: false,
        isError: false,
        isFetching: false,
      });

    it('pide confirmación, explica el efecto y desactiva la tarifa activa', async () => {
      const user = userEvent.setup();
      conTarifa(true);
      mockActualizarCuota.mockResolvedValue({});
      renderWithProviders(<CuotasPage />);

      await user.click(screen.getByRole('button', { name: 'Cambiar estado 7' }));

      const dialogo = screen.getByRole('dialog', { name: 'Desactivar tarifa' });
      expect(dialogo).toHaveTextContent('Fútbol · Juveniles, rige desde 04/2026.');
      expect(dialogo).toHaveTextContent('no se usa para calcular la cuota');
      await user.click(screen.getByRole('button', { name: 'Desactivar' }));

      expect(mockActualizarCuota).toHaveBeenCalledWith({
        id: 7,
        payload: { activo: false },
        mensaje: 'Tarifa desactivada',
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('activa una tarifa inactiva', async () => {
      const user = userEvent.setup();
      conTarifa(false);
      mockActualizarCuota.mockResolvedValue({});
      renderWithProviders(<CuotasPage />);

      await user.click(screen.getByRole('button', { name: 'Cambiar estado 7' }));
      expect(screen.getByRole('dialog', { name: 'Activar tarifa' })).toHaveTextContent(
        'Vuelve a usarse para calcular la cuota',
      );
      await user.click(screen.getByRole('button', { name: 'Activar' }));

      expect(mockActualizarCuota).toHaveBeenCalledWith({
        id: 7,
        payload: { activo: true },
        mensaje: 'Tarifa activada',
      });
    });

    it('si falla deja el diálogo abierto y no cambia nada', async () => {
      const user = userEvent.setup();
      conTarifa(true);
      mockActualizarCuota.mockRejectedValue(new Error('Sin conexión'));
      renderWithProviders(<CuotasPage />);

      await user.click(screen.getByRole('button', { name: 'Cambiar estado 7' }));
      await user.click(screen.getByRole('button', { name: 'Desactivar' }));

      expect(screen.getByRole('dialog', { name: 'Desactivar tarifa' })).toBeInTheDocument();
    });

    it('cancelar no llama a la API', async () => {
      const user = userEvent.setup();
      conTarifa(true);
      renderWithProviders(<CuotasPage />);

      await user.click(screen.getByRole('button', { name: 'Cambiar estado 7' }));
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(mockActualizarCuota).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
