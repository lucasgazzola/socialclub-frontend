import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MorososCuotaSocialPage } from './MorososCuotaSocialPage';
import { pagosApi } from '../api/pagos.api';
import * as useCategoriasModule from '@/features/socios/hooks/useCategorias';

vi.mock('../api/pagos.api');
vi.mock('@/features/socios/hooks/useCategorias');

const mockMorososData = {
  total: 2,
  deudaTotalClub: 18000,
  items: [
    {
      personaId: 101,
      nombreCompleto: 'Juan Gómez',
      nombre: 'Juan',
      apellido: 'Gómez',
      dni: '30111222',
      email: 'juan@test.com',
      telefono: '11223344',
      categoriaId: 1,
      categoria: 'Activo General',
      socioActivo: true,
      periodosAdeudados: ['2026-08', '2026-09'],
      cantidadPeriodos: 2,
      montoTotalDeuda: 10000,
      cuotasPendientes: [
        { periodo: '2026-08', monto: 5000, categoriaNombre: 'Activo General' },
        { periodo: '2026-09', monto: 5000, categoriaNombre: 'Activo General' },
      ],
    },
    {
      personaId: 102,
      nombreCompleto: 'Ana Martínez',
      nombre: 'Ana',
      apellido: 'Martínez',
      dni: '28333444',
      email: 'ana@test.com',
      telefono: null,
      categoriaId: 2,
      categoria: 'Juvenil',
      socioActivo: true,
      periodosAdeudados: ['2026-09'],
      cantidadPeriodos: 1,
      montoTotalDeuda: 8000,
      cuotasPendientes: [
        { periodo: '2026-09', monto: 8000, categoriaNombre: 'Juvenil' },
      ],
    },
  ],
};

describe('MorososCuotaSocialPage · US-19', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategoriasModule.useCategorias).mockReturnValue({
      data: [
        { id: 1, nombre: 'Activo General', descripcion: '', activo: true },
        { id: 2, nombre: 'Juvenil', descripcion: '', activo: true },
      ],
    } as any);
  });

  it('CA 1 & 4: Renderiza los morosos con datos completos, períodos adeudados y monto total', async () => {
    vi.mocked(pagosApi.getMorososCuotaSocial).mockResolvedValue(mockMorososData);

    renderWithProviders(<MorososCuotaSocialPage />);

    expect(await screen.findByText('Juan Gómez')).toBeInTheDocument();
    expect(screen.getByText('30111222')).toBeInTheDocument();
    expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
    expect(screen.getByText('28333444')).toBeInTheDocument();

    // Períodos adeudados
    expect(screen.getByText('2026-08')).toBeInTheDocument();
    expect(screen.getAllByText('2026-09').length).toBeGreaterThanOrEqual(1);

    // Contadores de resumen
    expect(screen.getByTestId('total-morosos')).toHaveTextContent('2');
  });

  it('CA 6: Muestra mensaje amigable cuando no hay morosos', async () => {
    vi.mocked(pagosApi.getMorososCuotaSocial).mockResolvedValue({
      total: 0,
      deudaTotalClub: 0,
      items: [],
    });

    renderWithProviders(<MorososCuotaSocialPage />);

    expect(
      await screen.findByText(/No se registran morosos de cuota social/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Todos los socios se encuentran al día con sus pagos/i),
    ).toBeInTheDocument();
  });

  it('CA 2: Permite cambiar el ordenamiento por monto o períodos atrasados', async () => {
    vi.mocked(pagosApi.getMorososCuotaSocial).mockResolvedValue(mockMorososData);
    const user = userEvent.setup();

    renderWithProviders(<MorososCuotaSocialPage />);
    await screen.findByText('Juan Gómez');

    const selectOrden = screen.getByLabelText(/Ordenar listado de morosos/i);
    await user.selectOptions(selectOrden, 'periodos-desc');

    await waitFor(() => {
      expect(pagosApi.getMorososCuotaSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          ordenarPor: 'periodos',
          orden: 'desc',
        }),
      );
    });
  });

  it('CA 3: Permite filtrar por búsqueda de texto y por categoría', async () => {
    vi.mocked(pagosApi.getMorososCuotaSocial).mockResolvedValue(mockMorososData);
    const user = userEvent.setup();

    renderWithProviders(<MorososCuotaSocialPage />);
    await screen.findByText('Juan Gómez');

    const inputBusqueda = screen.getByPlaceholderText(/Buscar por nombre, apellido o DNI/i);
    await user.type(inputBusqueda, 'Gómez');

    await waitFor(() => {
      expect(pagosApi.getMorososCuotaSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          busqueda: 'Gómez',
        }),
      );
    });

    const selectCat = screen.getByDisplayValue(/Todas las categorías/i);
    await user.selectOptions(selectCat, '1');

    await waitFor(() => {
      expect(pagosApi.getMorososCuotaSocial).toHaveBeenCalledWith(
        expect.objectContaining({
          categoriaId: 1,
        }),
      );
    });
  });

  it('CA 7: Permite al secretario abrir la acción de cobro para el socio seleccionado', async () => {
    vi.mocked(pagosApi.getMorososCuotaSocial).mockResolvedValue(mockMorososData);
    vi.mocked(pagosApi.getCuotasPendientesSocio).mockResolvedValue({
      personaId: 101,
      socioNombre: 'Juan Gómez',
      dni: '30111222',
      categoria: 'Activo General',
      categoriaId: 1,
      estadoFinanciero: 'MOROSO',
      cuotasPendientes: [
        { periodo: '2026-08', monto: 5000, categoriaNombre: 'Activo General' },
      ],
      totalAdeudado: 5000,
    });

    const user = userEvent.setup();
    renderWithProviders(<MorososCuotaSocialPage />);

    await screen.findByText('Juan Gómez');

    const botonesCobrar = screen.getAllByRole('button', { name: /cobrar/i });
    expect(botonesCobrar.length).toBeGreaterThan(0);

    await user.click(botonesCobrar[0]);

    // Verifica que el modal de cobro se abra con los datos del socio
    expect(await screen.findByText(/Registrar cobro de cuota social/i)).toBeInTheDocument();
  });
});

