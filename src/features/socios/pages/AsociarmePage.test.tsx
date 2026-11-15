import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { AsociarmePage } from './AsociarmePage';

let mockUsuario: unknown = null;
const mockRefrescar = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ usuario: mockUsuario, refrescar: mockRefrescar }) }));
vi.mock('@/features/auth/api/auth.api', () => ({ authApi: { refresh: vi.fn().mockResolvedValue({}) } }));

vi.mock('@/features/club/hooks/useClubPublico', () => ({
  useClubPublico: () => ({
    isLoading: false,
    data: {
      planes: [
        { categoriaId: 1, nombre: 'Cuota Juvenil', descripcion: null, cuotaMensual: 6000 },
        { categoriaId: 2, nombre: 'Cuota General', descripcion: null, cuotaMensual: 10000 },
      ],
      disciplinas: [],
      numeros: { socios: 0, participantes: 0, disciplinas: 0, eventosProximos: 0 },
    },
  }),
}));

const mockRegistrarme = vi.fn();
vi.mock('../hooks/useRegistrarmeSocio', () => ({ useRegistrarmeSocio: () => ({ mutateAsync: mockRegistrarme }) }));
const mockReactivarme = vi.fn();
vi.mock('../hooks/useReactivarmeSocio', () => ({ useReactivarmeSocio: () => ({ mutateAsync: mockReactivarme, isPending: false }) }));
vi.mock('../hooks/useCategorias', () => ({
  useCategorias: () => ({ isLoading: false, data: [{ id: 1, nombre: 'Cuota Juvenil' }, { id: 2, nombre: 'Cuota General' }] }),
}));

const mockMisCuotas = vi.fn();
vi.mock('@/features/pagos/hooks/useMisCuotas', () => ({ useMisCuotas: () => mockMisCuotas() }));
const mockIniciarPago = vi.fn();
vi.mock('@/features/pagos/hooks/useIniciarPagoCuotas', () => ({
  useIniciarPagoCuotas: () => ({ mutateAsync: mockIniciarPago, isPending: false }),
}));
const mockIrAPagar = vi.fn();
vi.mock('@/features/pasarela/hooks/usePasarela', () => ({ irAPagar: (url: string) => mockIrAPagar(url) }));

const usuarioSinMembresia = { id: 5, nombre: 'Sofía', apellido: 'Prueba', email: 's@club.local', roles: [], persona: { id: 5, dni: null, membresias: [] } };

describe('TASK-60 · US-09 · Asociarme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn() as never;
    localStorage.clear();
    mockUsuario = null;
    mockMisCuotas.mockReturnValue({ isLoading: false, data: { cuotasPendientes: [{ periodo: '2026-11', monto: 10000, categoriaNombre: 'Cuota General' }] } });
  });

  it('sin sesión: elegir un plan pide crear la cuenta o ingresar y recuerda volver al alta', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AsociarmePage />, { ruta: '/asociarme' });

    expect(screen.queryByText('2. Tu cuenta')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Cuota General/ }));
    expect(screen.getByRole('radio', { name: /Cuota General/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2. Tu cuenta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Crear mi cuenta/ }));
    expect(JSON.parse(localStorage.getItem('sc-volver-a') ?? '{}').ruta).toBe('/asociarme?plan=2');
  });

  it('con sesión: confirma los datos con el plan elegido y pasa a la primera cuota', async () => {
    const user = userEvent.setup();
    mockUsuario = usuarioSinMembresia;
    mockRegistrarme.mockResolvedValue({});
    renderWithProviders(<AsociarmePage />, { ruta: '/asociarme?plan=2' });

    // El plan elegido se muestra como dato del alta; solo se pide el DNI.
    expect(screen.getByLabelText('Plan')).toHaveDisplayValue(/Cuota General · \$\s10\.000 \/ mes/);
    await user.type(screen.getByLabelText('DNI'), '40123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar y asociarme' }));

    await waitFor(() => expect(mockRegistrarme).toHaveBeenCalledWith({ dni: '40123456', categoriaId: 2 }));
    expect(mockRefrescar).toHaveBeenCalled();
    expect(await screen.findByText('¡Ya sos socio!')).toBeInTheDocument();
    expect(screen.getByText('Cuota de noviembre de 2026')).toBeInTheDocument();
  });

  it('la primera cuota se paga con la pasarela (Mercado Pago o simulada)', async () => {
    const user = userEvent.setup();
    mockUsuario = usuarioSinMembresia;
    mockRegistrarme.mockResolvedValue({});
    mockIniciarPago.mockResolvedValue({ referencia: 'ref-1', urlPago: 'https://mp.test/pagar' });
    renderWithProviders(<AsociarmePage />, { ruta: '/asociarme?plan=2' });

    await user.type(screen.getByLabelText('DNI'), '40123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar y asociarme' }));
    await user.click(await screen.findByRole('button', { name: /Pagar con Mercado Pago/ }));

    expect(mockIniciarPago).toHaveBeenCalledWith(['2026-11']);
    expect(mockIrAPagar).toHaveBeenCalledWith('https://mp.test/pagar');
    expect(screen.getByRole('link', { name: 'Pagar más tarde' })).toHaveAttribute('href', '/mi-club');
  });

  it('un ex socio reactiva su membresía en lugar de cargar todo de nuevo', async () => {
    const user = userEvent.setup();
    mockUsuario = { ...usuarioSinMembresia, persona: { id: 5, membresias: [{ id: 1, activo: false, categoriaId: 2, fechaAlta: '2024-01-01' }] } };
    mockReactivarme.mockResolvedValue({});
    renderWithProviders(<AsociarmePage />, { ruta: '/asociarme?plan=2' });

    await user.click(screen.getByRole('button', { name: 'Reactivar mi membresía' }));
    expect(mockReactivarme).toHaveBeenCalled();
    expect(await screen.findByText('¡Ya sos socio!')).toBeInTheDocument();
  });

  it('a quien ya es socio le avisa y lo lleva a sus cuotas', () => {
    mockUsuario = { ...usuarioSinMembresia, roles: ['SOCIO'], persona: { id: 5, membresias: [{ id: 1, activo: true, categoriaId: 2, fechaAlta: '2025-01-01' }] } };
    renderWithProviders(<AsociarmePage />, { ruta: '/asociarme' });

    expect(screen.getByText('Ya sos socio del club')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver mis cuotas/ })).toHaveAttribute('href', '/mi-club/cuotas');
  });
});
