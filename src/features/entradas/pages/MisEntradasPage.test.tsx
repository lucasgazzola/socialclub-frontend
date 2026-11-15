import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MisEntradasPage } from './MisEntradasPage';
import type { Entrada, FiltrosMisEntradas } from '../types';

const mockUseMisEntradas = vi.fn();
vi.mock('../hooks/useEntradas', () => ({
  useMisEntradas: (params?: FiltrosMisEntradas) => mockUseMisEntradas(params),
}));

vi.mock('../components/QRCode', () => ({
  QRCode: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const mockDescargarPdf = vi.fn();
const mockDescargarTodas = vi.fn();
const mockDescargarQr = vi.fn();
vi.mock('../utils/descargarEntradaPdf', () => ({
  descargarEntradaPdf: (...args: unknown[]) => mockDescargarPdf(...args),
  descargarTodasEntradasPdf: (...args: unknown[]) => mockDescargarTodas(...args),
  descargarQR: (...args: unknown[]) => mockDescargarQr(...args),
}));

const MAÑANA = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const SEMANA_PASADA = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

function entrada(id: number, extra: Partial<Entrada> = {}, evento: Partial<NonNullable<Entrada['evento']>> = {}): Entrada {
  return {
    id,
    token: `token-${id}-abcdef`,
    eventoId: 7,
    estado: 'VALIDA',
    creadoEn: SEMANA_PASADA,
    ...extra,
    evento: {
      id: 7,
      nombre: 'Peña aniversario',
      entradasDisponibles: 10,
      entradasVendidas: 2,
      creadoEn: SEMANA_PASADA,
      actualizadoEn: SEMANA_PASADA,
      estado: 'PUBLICADO',
      fechaEvento: MAÑANA,
      lugarAcreditacion: 'Salón del club',
      ...evento,
    },
  } as Entrada;
}

function pagina(items: Entrada[], total = items.length) {
  return { data: { items, total, pagina: 1, porPagina: 50, totalPaginas: 1 }, isLoading: false, isError: false, isFetching: false };
}

/** Responde distinto según la pestaña que pide el hook. */
function mockPorVigencia(proximas: ReturnType<typeof pagina>, historial: ReturnType<typeof pagina>) {
  mockUseMisEntradas.mockImplementation((params?: FiltrosMisEntradas) =>
    params?.vigencia === 'HISTORIAL' ? historial : proximas,
  );
}

describe('US-52 · TASK-60 · MisEntradasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pide las próximas y el historial por separado y muestra cuántas hay en cada pestaña', () => {
    mockPorVigencia(pagina([entrada(1)]), pagina([], 4));

    renderWithProviders(<MisEntradasPage />);

    expect(mockUseMisEntradas).toHaveBeenCalledWith(expect.objectContaining({ vigencia: 'PROXIMAS', limit: 50 }));
    expect(mockUseMisEntradas).toHaveBeenCalledWith(expect.objectContaining({ vigencia: 'HISTORIAL' }));
    expect(screen.getByRole('tab', { name: /Próximas/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Historial/ })).toHaveTextContent('4');
  });

  it('muestra un esqueleto mientras carga', () => {
    mockUseMisEntradas.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByLabelText('Cargando entradas')).toHaveAttribute('aria-busy', 'true');
  });

  it('muestra un error si falla la consulta', () => {
    mockUseMisEntradas.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar tus entradas');
  });

  it('sin entradas próximas invita a ver los eventos', () => {
    mockPorVigencia(pagina([]), pagina([]));

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByText('No tenés entradas para próximos eventos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver eventos' })).toHaveAttribute('href', '/mi-club/eventos');
  });

  it('agrupa las entradas del mismo evento en una tarjeta con carrusel de QR', async () => {
    const user = userEvent.setup();
    mockPorVigencia(pagina([entrada(1), entrada(2)]), pagina([]));

    renderWithProviders(<MisEntradasPage />);

    const tarjeta = screen.getByTestId('entradas-evento-7');
    expect(within(tarjeta).getByText('2 entradas')).toBeInTheDocument();
    expect(within(tarjeta).getByTestId('qr-code')).toHaveTextContent('token-1-abcdef');

    await user.click(within(tarjeta).getByRole('button', { name: 'Entrada siguiente' }));
    expect(within(tarjeta).getByTestId('qr-code')).toHaveTextContent('token-2-abcdef');
    expect(within(tarjeta).getByText('2 de 2')).toBeInTheDocument();
  });

  it('una entrada válida se ve como tal y se puede descargar (PDF con todas y QR)', async () => {
    const user = userEvent.setup();
    const e1 = entrada(1);
    const e2 = entrada(2);
    mockPorVigencia(pagina([e1, e2]), pagina([]));

    renderWithProviders(<MisEntradasPage />);

    expect(screen.getByTestId('entrada-badge-1')).toHaveTextContent('Válida');
    expect(screen.getByText('Lista para presentar en la puerta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /PDF con todas/ }));
    expect(mockDescargarTodas).toHaveBeenCalledWith([e1, e2]);

    await user.click(screen.getByRole('button', { name: 'Descargar el QR como imagen' }));
    expect(mockDescargarQr).toHaveBeenCalledWith(e1);
  });

  it('«Mostrar en la puerta» abre el QR en pantalla completa y Escape lo cierra', async () => {
    const user = userEvent.setup();
    mockPorVigencia(pagina([entrada(1), entrada(2)]), pagina([]));

    renderWithProviders(<MisEntradasPage />);

    await user.click(screen.getByRole('button', { name: /Mostrar en la puerta/ }));
    const dialogo = screen.getByRole('dialog', { name: /Peña aniversario/ });
    expect(within(dialogo).getByText('Entrada 1 de 2')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Entrada siguiente' }));
    expect(within(dialogo).getByText('Entrada 2 de 2')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('en el historial, usadas, vencidas y canceladas se diferencian y no se pueden descargar', async () => {
    const user = userEvent.setup();
    mockPorVigencia(
      pagina([]),
      pagina([
        entrada(10, { estado: 'USADA', usadaEn: SEMANA_PASADA }, { id: 8, nombre: 'Cena', fechaEvento: SEMANA_PASADA }),
        entrada(11, { estado: 'EXPIRADA', eventoId: 9 }, { id: 9, nombre: 'Torneo', fechaEvento: SEMANA_PASADA }),
        entrada(12, { estado: 'EXPIRADA', eventoId: 10 }, { id: 10, nombre: 'Recital', estado: 'CANCELADO' }),
      ]),
    );
    // Cada entrada es de un evento distinto.
    renderWithProviders(<MisEntradasPage />);
    await user.click(screen.getByRole('tab', { name: /Historial/ }));

    expect(screen.getByTestId('entrada-badge-10')).toHaveTextContent('Usada');
    expect(screen.getByText(/^Usada el /)).toBeInTheDocument();
    expect(screen.getByTestId('entrada-badge-11')).toHaveTextContent('Vencida');
    expect(screen.getByText('El evento ya terminó')).toBeInTheDocument();
    expect(screen.getByTestId('entrada-badge-12')).toHaveTextContent('Cancelada');
    expect(screen.getByText('El evento fue cancelado')).toBeInTheDocument();

    // Sello sobre el QR y sin acciones de descarga ni pantalla completa.
    expect(screen.getByText('USADA')).toBeInTheDocument();
    expect(screen.getByText('VENCIDA')).toBeInTheDocument();
    expect(screen.getByText('CANCELADA')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mostrar en la puerta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PDF/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descargar el QR como imagen' })).not.toBeInTheDocument();
  });

  it('busca por evento en la pestaña activa', async () => {
    const user = userEvent.setup();
    mockPorVigencia(pagina([entrada(1)]), pagina([]));

    renderWithProviders(<MisEntradasPage />);
    await user.type(screen.getByTestId('buscar-entradas-input'), 'Peña');

    expect(
      await vi.waitFor(() => {
        const llamada = mockUseMisEntradas.mock.calls.find(([p]) => p?.search === 'Peña');
        if (!llamada) throw new Error('todavía no buscó');
        return llamada[0];
      }),
    ).toEqual(expect.objectContaining({ vigencia: 'PROXIMAS', search: 'Peña' }));
  });
});
