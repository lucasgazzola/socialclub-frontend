import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SociosTable } from './SociosTable';
import * as authHook from '@/features/auth/hooks/useAuth';
import * as desactivarHook from '../hooks/useDesactivarSocio';
import * as cuotasHook from '@/features/pagos/hooks/useCuotasPendientesSocio';
import type { Socio } from '../types';

vi.mock('../hooks/useDesactivarSocio', () => ({
  useDesactivarSocio: vi.fn(),
}));

vi.mock('@/features/pagos/hooks/useCuotasPendientesSocio', () => ({
  useCuotasPendientesSocio: vi.fn(),
}));

vi.mock('@/features/pagos/components/ModalCobroCuotaSocio', () => ({
  ModalCobroCuotaSocio: ({
    open,
    socio,
  }: {
    open: boolean;
    socio: Socio | null;
  }) =>
    open ? (
      <div data-testid="modal-cobro-mock">
        Modal Cobro abierto para: {socio?.apellido}, {socio?.nombre}
      </div>
    ) : null,
}));

const SOCIOS_FIXTURE: Socio[] = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '30111222',
    email: 'juan@test.com',
    telefono: '12345678',
    activo: true,
    categoria: { id: 1, nombre: 'Activo' },
    creadoEn: '2026-01-01',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SociosTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(desactivarHook, 'useDesactivarSocio').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof desactivarHook.useDesactivarSocio>);

    vi.spyOn(cuotasHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: {
        estadoFinanciero: 'AL_DIA',
        cuotasPendientes: [],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof cuotasHook.useCuotasPendientesSocio>);
  });

  it('muestra mensaje cuando no hay socios', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    renderWithProviders(<SociosTable socios={[]} />);
    expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument();
  });

  it('muestra la columna Estado con "Al día" cuando el socio está al día', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    renderWithProviders(<SociosTable socios={SOCIOS_FIXTURE} />);

    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Al día')).toBeInTheDocument();
  });

  it('muestra el badge de Moroso en la columna Estado cuando debe cuotas y abre el cobro', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    vi.spyOn(cuotasHook, 'useCuotasPendientesSocio').mockReturnValue({
      data: {
        estadoFinanciero: 'MOROSO',
        cuotasPendientes: [{ periodo: '2026-08', monto: 15000, categoriaNombre: 'Activo' }],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof cuotasHook.useCuotasPendientesSocio>);

    renderWithProviders(<SociosTable socios={SOCIOS_FIXTURE} />);

    const badgeMoroso = screen.getByRole('button', { name: /Moroso \(1\)/i });
    expect(badgeMoroso).toBeInTheDocument();

    fireEvent.click(badgeMoroso);
    expect(screen.getByTestId('modal-cobro-mock')).toBeInTheDocument();
  });

  it('muestra el botón Cobrar para usuarios ADMIN y COLABORADOR y abre el modal', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['COLABORADOR'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    renderWithProviders(<SociosTable socios={SOCIOS_FIXTURE} />);

    const btnCobrar = screen.getByRole('button', { name: /Cobrar/i });
    expect(btnCobrar).toBeInTheDocument();

    fireEvent.click(btnCobrar);
    expect(screen.getByTestId('modal-cobro-mock')).toBeInTheDocument();
    expect(screen.getByText(/Modal Cobro abierto para: Pérez, Juan/i)).toBeInTheDocument();
  });

  it('muestra "Baja" cuando el socio no está activo', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    const socioInactivo: Socio = {
      ...SOCIOS_FIXTURE[0],
      id: 2,
      activo: false,
    };

    renderWithProviders(<SociosTable socios={[socioInactivo]} />);

    expect(screen.getByText('Baja')).toBeInTheDocument();
  });

  it('permite a un ADMIN ver el botón Editar y confirmar dar de baja', () => {
    const desactivarMock = vi.fn();
    vi.spyOn(desactivarHook, 'useDesactivarSocio').mockReturnValue({
      mutate: desactivarMock,
      isPending: false,
    } as unknown as ReturnType<typeof desactivarHook.useDesactivarSocio>);

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    renderWithProviders(<SociosTable socios={SOCIOS_FIXTURE} />);

    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
    const btnBaja = screen.getByRole('button', { name: /Dar de baja/i });
    expect(btnBaja).toBeInTheDocument();

    fireEvent.click(btnBaja);
    expect(screen.getByText(/¿Confirmar baja\?/i)).toBeInTheDocument();

    const btnSi = screen.getByRole('button', { name: /^Sí$/i });
    fireEvent.click(btnSi);
    expect(desactivarMock).toHaveBeenCalledWith(1);
  });

  it('ordena los socios por fecha de creación descendente (más recientes primero)', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      usuario: { roles: ['ADMIN'] },
    } as unknown as ReturnType<typeof authHook.useAuth>);

    const sociosDesordenados: Socio[] = [
      {
        ...SOCIOS_FIXTURE[0],
        id: 10,
        nombre: 'Antiguo',
        apellido: 'Socio',
        creadoEn: '2025-01-01T00:00:00Z',
      },
      {
        ...SOCIOS_FIXTURE[0],
        id: 20,
        nombre: 'Reciente',
        apellido: 'Socio',
        creadoEn: '2026-06-01T00:00:00Z',
      },
    ];

    renderWithProviders(<SociosTable socios={sociosDesordenados} />);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Reciente');
    expect(rows[2]).toHaveTextContent('Antiguo');
  });
});
