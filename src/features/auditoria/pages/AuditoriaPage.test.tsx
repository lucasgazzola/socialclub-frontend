import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { AuditoriaPage } from './AuditoriaPage';

const mockUseAuditoria = vi.fn();
vi.mock('../hooks/useAuditoria', () => ({
  useAuditoria: (params: any) => mockUseAuditoria(params),
}));

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner cuando está cargando', () => {
    mockUseAuditoria.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(<AuditoriaPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra error cuando la consulta falla', () => {
    mockUseAuditoria.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Fallo de red'),
    });

    renderWithProviders(<AuditoriaPage />);

    expect(screen.getByText('Fallo de red')).toBeInTheDocument();
  });

  it('renderiza tabla de registros y permite paginación y filtrado', async () => {
    const user = userEvent.setup();
    mockUseAuditoria.mockReturnValue({
      data: {
        items: [
          {
            id: 1,
            fechaHora: '2026-03-01T10:00:00Z',
            accion: 'LOGIN',
            entidad: 'Usuario',
            idEntidad: '123',
            responsable: { nombre: 'Carlos', apellido: 'Perez' },
            detalle: 'Inicio de sesión',
          },
        ],
        total: 45,
        porPagina: 20,
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });

    renderWithProviders(<AuditoriaPage />);

    expect(screen.getByText('Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Carlos Perez')).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1-10 de 45 resultados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();

    const select = screen.getByLabelText(/acción/i);
    await user.selectOptions(select, 'CREAR');

    expect(mockUseAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'CREAR',
        pagina: 1,
      }),
    );

    const sigButton = screen.getByRole('button', { name: /Siguiente/i });
    expect(sigButton).not.toBeDisabled();
    await user.click(sigButton);

    expect(mockUseAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 2,
      }),
    );
  });
});
