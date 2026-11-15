import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { clubApi } from './club.api';
import { useClubPublico } from '../hooks/useClubPublico';

vi.mock('@/lib/api/client', () => ({ apiClient: { get: vi.fn() } }));

const respuesta = { planes: [], disciplinas: [], numeros: { socios: 1, participantes: 2, disciplinas: 3, eventosProximos: 4 } };

describe('TASK-60 · información pública del club', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: respuesta });
  });

  it('consulta GET /club/publico', async () => {
    await expect(clubApi.informacionPublica()).resolves.toEqual(respuesta);
    expect(apiClient.get).toHaveBeenCalledWith('/club/publico');
  });

  it('useClubPublico expone la respuesta', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useClubPublico(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.numeros.socios).toBe(1);
  });
});
