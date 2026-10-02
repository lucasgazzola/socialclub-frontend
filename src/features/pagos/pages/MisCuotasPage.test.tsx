import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MisCuotasPage } from './MisCuotasPage';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { useHistorialPagos } from '../hooks/useHistorialPagos';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('../hooks/useMisCuotas', () => ({
  useMisCuotas: vi.fn(),
}));

vi.mock('../hooks/useHistorialPagos', () => ({
  useHistorialPagos: vi.fn(),
}));

vi.mock('../hooks/useRegistrarPago', () => ({
  useRegistrarPago: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MisCuotasPage />
    </MemoryRouter>,
  );
}

describe('MisCuotasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deshabilita las consultas HTTP si el usuario nunca fue socio', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: {
        id: 1,
        email: 'user@test.com',
        roles: ['ADMIN'],
        persona: null,
      },
    } as never);

    vi.mocked(useMisCuotas).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useHistorialPagos).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as never);

    renderPage();

    expect(useMisCuotas).toHaveBeenCalledWith({ enabled: false });
    expect(useHistorialPagos).toHaveBeenCalledWith({ enabled: false });
  });

  it('habilita las consultas HTTP y muestra datos si el usuario es o fue socio', () => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: {
        id: 2,
        email: 'socio@test.com',
        roles: ['SOCIO'],
        persona: {
          id: 10,
          membresias: [
            {
              id: 100,
              categoriaId: 1,
              fechaAlta: '2026-01-01',
              activo: true,
            },
          ],
        },
      },
    } as never);

    vi.mocked(useMisCuotas).mockReturnValue({
      data: {
        socioNombre: 'Juan Pérez',
        categoria: 'Pleno',
        estadoFinanciero: 'AL_DIA',
        cuotasPendientes: [],
      },
      isLoading: false,
      isError: false,
    } as never);

    vi.mocked(useHistorialPagos).mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderPage();

    expect(useMisCuotas).toHaveBeenCalledWith({ enabled: true });
    expect(useHistorialPagos).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });
});
