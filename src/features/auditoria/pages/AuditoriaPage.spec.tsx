import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditoriaPage } from './AuditoriaPage';
import * as auditoriaHook from '../hooks/useAuditoria';

vi.mock('../hooks/useAuditoria', () => ({
  useAuditoria: vi.fn(),
}));

const MOCK_DATA = {
  items: [
    {
      id: 1,
      fechaHora: '2026-03-15T14:30:00.000Z',
      accion: 'CREAR' as const,
      entidad: 'Socio',
      idEntidad: 10,
      responsable: {
        id: 2,
        nombre: 'Carlos',
        apellido: 'Gómez',
        email: 'carlos@club.com',
      },
      detalle: 'Alta de nuevo socio',
    },
  ],
  total: 45,
  pagina: 1,
  porPagina: 10,
};

describe('US-33 · AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título, subtítulo y tabla con los registros devueltos por useAuditoria', () => {
    vi.mocked(auditoriaHook.useAuditoria).mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
    } as any);

    render(<AuditoriaPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Auditoría' })).toBeInTheDocument();
    expect(
      screen.getByText('Registro inalterable de todas las operaciones del sistema.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Socio')).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1-10 de 45 resultados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeInTheDocument();
  });

  it('permite avanzar a la siguiente página y deshabilita botón anterior en la primera página', () => {
    vi.mocked(auditoriaHook.useAuditoria).mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
    } as any);

    render(<AuditoriaPage />);

    const btnAnterior = screen.getByRole('button', { name: /anterior/i });
    const btnSiguiente = screen.getByRole('button', { name: /siguiente/i });

    expect(btnAnterior).toBeDisabled();
    expect(btnSiguiente).not.toBeDisabled();

    fireEvent.click(btnSiguiente);

    expect(auditoriaHook.useAuditoria).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pagina: 2,
        porPagina: 10,
      }),
    );
  });

  it('aplica filtros reactivamente y reinicia la paginación a la página 1', async () => {
    vi.mocked(auditoriaHook.useAuditoria).mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
    } as any);

    render(<AuditoriaPage />);

    fireEvent.change(screen.getByLabelText(/acción/i), { target: { value: 'BAJA' } });
    fireEvent.change(screen.getByPlaceholderText(/buscar por entidad/i), {
      target: { value: 'Disciplina' },
    });

    await waitFor(() => {
      expect(auditoriaHook.useAuditoria).toHaveBeenLastCalledWith(
        expect.objectContaining({
          accion: 'BAJA',
          entidad: 'Disciplina',
          pagina: 1,
        }),
      );
    });
  });

  it('aplica filtro por período rápido al seleccionar pestaña', async () => {
    vi.mocked(auditoriaHook.useAuditoria).mockReturnValue({
      data: MOCK_DATA,
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
    } as any);

    render(<AuditoriaPage />);

    fireEvent.click(screen.getByRole('tab', { name: /últimas 24h/i }));

    await waitFor(() => {
      expect(auditoriaHook.useAuditoria).toHaveBeenLastCalledWith(
        expect.objectContaining({
          periodo: '24h',
          pagina: 1,
        }),
      );
    });
  });

  it('muestra mensaje de error cuando falla la consulta', () => {
    vi.mocked(auditoriaHook.useAuditoria).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al conectar con la base de datos'),
      isFetching: false,
    } as any);

    render(<AuditoriaPage />);

    expect(
      screen.getByText('Error al conectar con la base de datos'),
    ).toBeInTheDocument();
  });
});
