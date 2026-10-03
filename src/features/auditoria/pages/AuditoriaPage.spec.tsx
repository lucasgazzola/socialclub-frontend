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
  porPagina: 20,
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
    expect(screen.getByText('45 registro(s)')).toBeInTheDocument();
    expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument();
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
        porPagina: 20,
      }),
    );
  });

  it('aplica filtros y reinicia la paginación a la página 1', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /filtrar/i }));

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
