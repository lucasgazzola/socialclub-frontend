import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MiClubInicioPage } from './MiClubInicioPage';

let mockUsuario: unknown = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ usuario: mockUsuario }) }));

const mockCuotas = vi.fn();
vi.mock('@/features/pagos/hooks/useMisCuotas', () => ({ useMisCuotas: (o: unknown) => mockCuotas(o) }));
const mockEntradas = vi.fn();
vi.mock('@/features/entradas/hooks/useEntradas', () => ({ useMisEntradas: (p: unknown) => mockEntradas(p) }));
const mockReservas = vi.fn();
vi.mock('@/features/reservas/hooks/useReservas', () => ({ useMisReservas: () => mockReservas() }));
const mockSolicitudes = vi.fn();
vi.mock('@/features/inscripcion/hooks/useSolicitarInscripcion', () => ({
  useMisSolicitudesInscripcion: () => mockSolicitudes(),
}));
vi.mock('@/features/entradas/components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr">{value}</div>,
}));

const socio = {
  id: 1,
  nombre: 'Lucía',
  apellido: 'Vázquez',
  email: 'l@club.local',
  roles: ['SOCIO'],
  persona: {
    id: 1,
    dni: '30000003',
    membresias: [{ id: 1, activo: true, categoriaId: 2, categoria: { id: 2, nombre: 'Cuota General' }, fechaAlta: '2025-02-28T00:00:00Z' }],
  },
};

describe('TASK-60 · Inicio de Mi club', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsuario = socio;
    mockCuotas.mockReturnValue({ data: undefined });
    mockEntradas.mockReturnValue({ data: { items: [] } });
    mockReservas.mockReturnValue({ data: [] });
    mockSolicitudes.mockReturnValue({ data: [] });
  });

  it('muestra la credencial del socio con categoría, DNI y antigüedad', () => {
    renderWithProviders(<MiClubInicioPage />);

    expect(screen.getByRole('heading', { name: 'Hola, Lucía' })).toBeInTheDocument();
    const credencial = screen.getByTestId('credencial-socio');
    expect(credencial).toHaveTextContent('Cuota General');
    expect(credencial).toHaveTextContent('30.000.003');
    expect(mockCuotas).toHaveBeenCalledWith({ enabled: true });
  });

  it('sin pendientes avisa que está al día', () => {
    renderWithProviders(<MiClubInicioPage />);
    expect(screen.getByText(/Estás al día/)).toBeInTheDocument();
  });

  it('lista lo que hay que hacer: cuotas vencidas, seña de reserva y solicitudes', () => {
    mockCuotas.mockReturnValue({
      data: { estadoFinanciero: 'MOROSO', totalAdeudado: 30000, cuotasPendientes: [{ periodo: '2026-09' }, { periodo: '2026-10' }] },
    });
    mockReservas.mockReturnValue({
      data: [{ id: 4, codigo: 'RES-AB12', puedePagarSena: true, montoSena: 5000, espacio: { nombre: 'Quincho' }, limitePagoSenaTexto: '20/11 18:00' }],
    });
    mockSolicitudes.mockReturnValue({ data: [{ id: 1, estado: 'PENDIENTE_DOCUMENTACION', disciplina: { nombre: 'Natación' } }] });

    renderWithProviders(<MiClubInicioPage />);

    expect(screen.getByRole('link', { name: /Tenés cuotas vencidas.*2 cuotas/ })).toHaveAttribute('href', '/mi-club/cuotas');
    expect(screen.getByRole('link', { name: /seña de tu reserva RES-AB12/ })).toHaveAttribute('href', '/mi-club/reservas');
    expect(screen.getByRole('link', { name: /espera tu documentación.*Natación/ })).toHaveAttribute(
      'href',
      '/mi-club/disciplinas/solicitudes',
    );
  });

  it('muestra la próxima entrada y la abre en pantalla completa', async () => {
    const user = userEvent.setup();
    mockEntradas.mockReturnValue({
      data: { items: [{ id: 9, token: 'tok-9', eventoId: 1, estado: 'VALIDA', creadoEn: '', evento: { id: 1, nombre: 'Peña', fechaEvento: '2026-12-01T23:00:00Z' } }] },
    });

    renderWithProviders(<MiClubInicioPage />);

    expect(mockEntradas).toHaveBeenCalledWith({ vigencia: 'PROXIMAS', page: 1, limit: 1 });
    expect(screen.getByText('Peña')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Mostrar en la puerta/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('a un participante sin membresía le ofrece hacerse socio y no consulta cuotas', () => {
    mockUsuario = { ...socio, roles: [], persona: { id: 2, membresias: [] } };

    renderWithProviders(<MiClubInicioPage />);

    expect(screen.getByRole('link', { name: /Hacete socio/ })).toHaveAttribute('href', '/asociarme');
    expect(screen.queryByTestId('credencial-socio')).not.toBeInTheDocument();
    expect(mockCuotas).toHaveBeenCalledWith({ enabled: false });
  });
});
