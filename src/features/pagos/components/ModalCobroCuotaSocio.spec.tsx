import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalCobroCuotaSocio } from './ModalCobroCuotaSocio';
import * as useCuotasPendientesHook from '../hooks/useCuotasPendientesSocio';
import * as useRegistrarPagoSocioHook from '../hooks/useRegistrarPagoSocio';

const SOCIO_MOCK = {
  id: 20,
  nombre: 'Carlos',
  apellido: 'SinCuenta',
  dni: '20000002',
};

const CUOTAS_MOCK = {
  personaId: 20,
  socioNombre: 'Carlos SinCuenta',
  dni: '20000002',
  categoria: 'Cuota Senior',
  categoriaId: 3,
  estadoFinanciero: 'MOROSO' as const,
  cuotasPendientes: [
    { periodo: '2026-08', monto: 15000, categoriaNombre: 'Cuota Senior' },
    { periodo: '2026-09', monto: 15000, categoriaNombre: 'Cuota Senior' },
  ],
  totalAdeudado: 30000,
};

describe('US-17 · ModalCobroCuotaSocio Component', () => {
  const mutateAsyncMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useRegistrarPagoSocioHook, 'useRegistrarPagoSocio').mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    } as unknown as ReturnType<typeof useRegistrarPagoSocioHook.useRegistrarPagoSocio>);
  });

  it('no renderiza nada si open es false', () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={false} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    expect(screen.queryByText(/Registrar cobro de cuota social/i)).not.toBeInTheDocument();
  });

  it('muestra estado de carga mientras consulta las cuotas', () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    expect(
      screen.getByText(/Consultando cuotas pendientes del socio/i),
    ).toBeInTheDocument();
  });

  it('muestra mensaje amigable y opción de reintento si ocurre un error', () => {
    const refetchMock = vi.fn();
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al conectar con el servidor'),
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    expect(
      screen.getByText(/No se pudo cargar la información de cuotas/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Error al conectar con el servidor/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('muestra estado ¡Socio al día! si no registra cuotas pendientes', () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: {
        ...CUOTAS_MOCK,
        estadoFinanciero: 'AL_DIA',
        cuotasPendientes: [],
        totalAdeudado: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    expect(screen.getByText(/¡Socio al día!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Este socio no registra cuotas sociales pendientes/i),
    ).toBeInTheDocument();

    // Botón de cierre
    const btnCerrar = screen.getByRole('button', { name: /^Entendido$/i });
    fireEvent.click(btnCerrar);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renderiza cuotas pendientes, calcula totales dinámicamente y registra el cobro', async () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: CUOTAS_MOCK,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    mutateAsyncMock.mockResolvedValue({
      mensaje: 'Pago registrado correctamente',
      pagos: [],
      estadoFinancieroActual: 'AL_DIA',
      cuotasPendientesRestantes: 0,
    });

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    // Ficha y cuotas
    expect(screen.getByText(/Carlos SinCuenta/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-08/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-09/i)).toBeInTheDocument();

    // El botón de confirmar arranca deshabilitado sin selección
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar cobro/i });
    expect(btnConfirmar).toBeDisabled();

    // Marcamos la primera cuota
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    fireEvent.click(checkboxes[0]);

    // Debe habilitarse el botón de confirmación con el monto de la cuota
    expect(btnConfirmar).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Confirmar cobro \(\$15\.000/i })).toBeInTheDocument();

    // Usamos el botón Seleccionar todas
    const btnSelectAll = screen.getByRole('button', { name: /^Seleccionar todas$/i });
    fireEvent.click(btnSelectAll);
    expect(screen.getByRole('button', { name: /Confirmar cobro \(\$30\.000/i })).toBeInTheDocument();

    // Cambiamos el método de pago a TRANSFERENCIA
    const selectMetodo = screen.getByLabelText(/Método de pago/i);
    fireEvent.change(selectMetodo, { target: { value: 'TRANSFERENCIA' } });

    // Ingresamos observaciones
    const inputObs = screen.getByPlaceholderText(/Ej: Cobro en ventanilla/i);
    fireEvent.change(inputObs, { target: { value: 'Transferencia comprobante #9876' } });

    // Enviamos el cobro
    fireEvent.click(screen.getByRole('button', { name: /Confirmar cobro/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        periodos: ['2026-08', '2026-09'],
        metodoPago: 'TRANSFERENCIA',
        observaciones: 'Transferencia comprobante #9876',
      });
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('permite deseleccionar todas las cuotas', () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: CUOTAS_MOCK,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    // Seleccionamos todas
    fireEvent.click(screen.getByRole('button', { name: /^Seleccionar todas$/i }));
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar cobro/i });
    expect(btnConfirmar).not.toBeDisabled();

    // Deseleccionamos todas
    fireEvent.click(screen.getByRole('button', { name: /^Deseleccionar todas$/i }));
    expect(btnConfirmar).toBeDisabled();
  });

  it('muestra por defecto "Seleccionar método de pago" y exige seleccionar uno para confirmar el cobro', () => {
    vi.spyOn(useCuotasPendientesHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: CUOTAS_MOCK,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCuotasPendientesHook.useCuotasPendientesSocio>);

    render(
      <ModalCobroCuotaSocio open={true} onClose={onCloseMock} socio={SOCIO_MOCK} />,
    );

    // El select arranca en la opción placeholder vacía
    const selectMetodo = screen.getByLabelText(/Método de pago/i) as HTMLSelectElement;
    expect(selectMetodo.value).toBe('');
    expect(screen.getByRole('option', { name: /Seleccionar método de pago/i })).toBeInTheDocument();

    // Seleccionamos una cuota para habilitar el botón
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Hacemos clic en confirmar cobro sin haber elegido método de pago
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar cobro/i });
    fireEvent.click(btnConfirmar);

    // Debe mostrar el error de validación y no llamar a la mutación
    expect(screen.getByText(/Seleccioná un método de pago válido/i)).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();

    // Al elegir un método, el error se despeja
    fireEvent.change(selectMetodo, { target: { value: 'EFECTIVO' } });
    expect(screen.queryByText(/Seleccioná un método de pago válido/i)).not.toBeInTheDocument();
  });
});
