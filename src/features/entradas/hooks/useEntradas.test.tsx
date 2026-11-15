import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { entradasApi } from '../api/entradas.api';
import {
  useMisEntradas,
  useValidarEntrada,
  useCrearEntradas,
  useEntradasPorEvento,
  useIniciarCompraEntradas,
} from './useEntradas';

vi.mock('../api/entradas.api', () => ({
  entradasApi: {
    crearEntradas: vi.fn(),
    listarEntradasPorEvento: vi.fn(),
    validarEntrada: vi.fn(),
    iniciarCompra: vi.fn(),
    listarMisEntradas: vi.fn(),
  },
}));

describe('useEntradas hooks & api', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('useMisEntradas llama a entradasApi.listarMisEntradas con los filtros', async () => {
    const mockRes = {
      items: [],
      total: 0,
      pagina: 1,
      porPagina: 10,
      totalPaginas: 1,
    };
    vi.mocked(entradasApi.listarMisEntradas).mockResolvedValueOnce(mockRes);

    const { result } = renderHook(() => useMisEntradas({ page: 2, limit: 10, search: 'Torneo' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(entradasApi.listarMisEntradas).toHaveBeenCalledWith({ page: 2, limit: 10, search: 'Torneo' });
    expect(result.current.data).toEqual(mockRes);
  });

  it('useValidarEntrada llama a entradasApi.validarEntrada con payload completo e invalida evento si existe', async () => {
    const mockRes = {
      acceso: 'PERMITIDO' as const,
      entrada: { id: 5, eventoId: 2, eventoNombre: 'Torneo' },
    };
    vi.mocked(entradasApi.validarEntrada).mockResolvedValueOnce(mockRes);

    const { result } = renderHook(() => useValidarEntrada(), { wrapper });

    await result.current.mutateAsync({ token: 'tok-123', eventoId: 2 });
    expect(entradasApi.validarEntrada).toHaveBeenCalledWith({ token: 'tok-123', eventoId: 2 });
  });

  it('useValidarEntrada maneja respuesta sin eventoId', async () => {
    const mockRes = {
      acceso: 'PERMITIDO' as const,
      entrada: undefined as unknown as { id: number; eventoId: number; eventoNombre: string },
    };
    vi.mocked(entradasApi.validarEntrada).mockResolvedValueOnce(mockRes);

    const { result } = renderHook(() => useValidarEntrada(), { wrapper });

    await result.current.mutateAsync({ token: 'tok-sin-evento', eventoId: 1 });
    expect(entradasApi.validarEntrada).toHaveBeenCalledWith({ token: 'tok-sin-evento', eventoId: 1 });
  });

  it('useCrearEntradas llama a crearEntradas e invalida caches', async () => {
    vi.mocked(entradasApi.crearEntradas).mockResolvedValueOnce({
      eventoId: 2,
      eventoNombre: 'Torneo',
      cantidad: 5,
      entradas: [],
    });

    const { result } = renderHook(() => useCrearEntradas(), { wrapper });
    await result.current.mutateAsync({ eventoId: 2, cantidad: 5 });
    expect(entradasApi.crearEntradas).toHaveBeenCalledWith(2, 5);
  });

  it('useEntradasPorEvento consulta por evento si el id es válido', async () => {
    vi.mocked(entradasApi.listarEntradasPorEvento).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useEntradasPorEvento(2), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(entradasApi.listarEntradasPorEvento).toHaveBeenCalledWith(2);
  });

  it('useIniciarCompraEntradas inicia compra correctamente', async () => {
    vi.mocked(entradasApi.iniciarCompra).mockResolvedValueOnce({
      id: 1,
      concepto: 'ENTRADAS',
      montoTotal: 1000,
      estado: 'PENDIENTE',
      urlPago: 'https://pago.mock',
      referencia: 'ref-1',
      creadoEn: '2026-01-01',
      expiraEn: '2026-01-02',
    });

    const { result } = renderHook(() => useIniciarCompraEntradas(), { wrapper });
    await result.current.mutateAsync({ eventoId: 2, cantidad: 1 });
    expect(entradasApi.iniciarCompra).toHaveBeenCalledWith(
      expect.objectContaining({ eventoId: 2, cantidad: 1 }),
      expect.anything(),
    );
  });
});
